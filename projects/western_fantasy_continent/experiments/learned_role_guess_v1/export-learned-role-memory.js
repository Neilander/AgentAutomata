const fs = require("node:fs");
const path = require("node:path");

const COMPOSITION = require("../player_agent_api_loop_v1/isolated-player-cognition-composition");
const ENTITY = require("../entity_impression_knowledge_v1/entity-impression-model");

const ROOT_REPOSITORY = path.resolve(__dirname, "../../../../../..");
const DEFAULT_SESSION = path.join(
  ROOT_REPOSITORY,
  "projects",
  "western_fantasy_continent",
  ".local_run_archive",
  "player_agent_api_loop_v1",
  "controlled_runs",
  "2026-07-17_enriched_two_chapter",
  "open_novice",
  "paired-alpha",
  "session.json",
);
const SESSION_PATH = process.env.LEARNED_ROLE_SESSION || DEFAULT_SESSION;
const OUTPUT_PATH = path.join(__dirname, "artifacts", "learned-role-memory.json");

const DOMAIN_LABELS = {
  healing: "通过恢复生命治疗队友",
  shielding: "通过护盾吸收伤害",
  area_damage: "同时攻击多个敌人、清理群体目标",
  sustained_damage: "长时间持续造成伤害",
};

function main() {
  if (!fs.existsSync(SESSION_PATH)) {
    throw new Error(`Frozen 22-battle session not found: ${SESSION_PATH}`);
  }
  const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
  const records = [
    ...(session.chapter1?.history || []),
    ...(session.chapter2?.history || []),
  ];
  const challenges = records.filter((record) => (
    String(record.action || "").startsWith("challenge:")
    && Array.isArray(record.rawEventLog)
    && Array.isArray(record.eventLog)
  ));

  let entityImpressionState = null;
  let rosterExpectationState = null;
  for (const record of challenges) {
    const movedIds = new Set(
      (record.entityImpressionUpdate?.movements || []).map((row) => row.id),
    );
    const playerTeam = (record.entityImpressionUpdate?.currentStrengthCognition || [])
      .filter((row) => movedIds.has(row.subject?.id))
      .map((row) => row.subject);
    const teamIds = record.rosterExpectationUpdate?.teamIds
      || playerTeam.map((unit) => unit.id);
    const output = COMPOSITION.processBattleInIsolation({
      reportId: `learned-role:${record.cycle}:${record.action}`,
      seed: `learned-role:${record.cycle}:${record.action}`,
      episodeId: `learned-role:${record.cycle}`,
      action: record.action,
      outcome: record.outcome,
      environment: {
        id: record.gameEvent?.node,
        label: record.gameEvent?.node,
        region: record.rosterExpectationUpdate?.region,
        tags: record.rosterExpectationUpdate?.contextTags || [],
      },
      playerTeam,
      teamIds,
      gameEvent: record.gameEvent,
      eventLog: record.eventLog,
      rawEventLog: record.rawEventLog,
      entityImpressionState,
      rosterExpectationState,
      perceptionProfile: session.perceptionProfile || "ordinary",
      informationPerceptionLevel: "ordinary",
      region: record.rosterExpectationUpdate?.region,
      performanceScore: record.rosterExpectationUpdate?.performanceScore,
      equippedPower: record.rosterExpectationUpdate?.equippedPower,
      equipmentFingerprint: record.rosterExpectationUpdate?.equipmentFingerprint,
    });
    entityImpressionState = output.states.entityImpressionState;
    rosterExpectationState = output.states.rosterExpectationState;
  }

  const characters = ENTITY.listCurrentCapabilityCognition(entityImpressionState)
    .map((row) => buildCharacterMemory(row, entityImpressionState))
    .sort((left, right) => left.id.localeCompare(right.id));
  const artifact = {
    schema: "learned_role_memory_v1",
    source: {
      session: "frozen_2026-07-17_enriched_two_chapter/open_novice/paired-alpha",
      battleCount: challenges.length,
      perceptionProfile: session.perceptionProfile || "ordinary",
      designerStatsExposed: false,
      generatedFromPlayerVisibleSignals: true,
    },
    characterCount: characters.length,
    characters,
  };
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    result: "PASS",
    output: OUTPUT_PATH,
    battles: challenges.length,
    characters: characters.length,
    traitAtomCount: characters.reduce((total, row) => total + row.traits.length, 0),
    knownCapabilityAtomCount: characters.reduce(
      (total, row) => total + Object.keys(row.capabilities).length,
      0,
    ),
  }, null, 2));
}

function buildCharacterMemory(row, state) {
  const beliefs = ENTITY.retrieveImpressions(state, row.subject.id);
  const traits = beliefs
    .filter((belief) => belief.kind === "trait" && belief.claim?.synthesized)
    .map((belief) => ({
      domain: belief.claim.domain,
      semanticDescription: DOMAIN_LABELS[belief.claim.domain]
        || ENTITY.DOMAIN_LABELS[belief.claim.domain]
        || belief.claim.domain,
      level: Number(belief.claim.level || 0),
      currentSalient: Boolean(belief.claim.currentSalient),
      status: belief.claim.status,
      observationCount: Number(belief.observationCount || 0),
      confidenceText: confidenceText(belief.observationCount),
    }))
    .sort((left, right) => left.domain.localeCompare(right.domain));
  const capabilities = Object.fromEntries(
    Object.entries(row.capabilities || {}).map(([axis, value]) => [axis, {
      axis,
      semanticDescription: capabilityDescription(axis),
      position: Number(value.position),
      relativeToScale: Number(value.relativeToScale),
      cognitionLabel: value.cognitionLabel,
      evidenceCount: Number(value.evidenceCount || 0),
      confidenceText: confidenceText(value.evidenceCount),
    }]),
  );
  const retrievalParts = [
    ...Object.values(capabilities).map((capability) => (
      `${capability.semanticDescription}：${capability.cognitionLabel}，${capability.confidenceText}`
    )),
    ...traits.map((trait) => (
      `${trait.semanticDescription}：${trait.currentSalient ? "当前印象明显" : "当前印象不明显"}，${trait.confidenceText}`
    )),
  ];
  return {
    id: row.subject.id,
    name: row.subject.name,
    role: row.subject.role,
    capabilities,
    traits,
    retrievalText: retrievalParts.join("。") + "。",
    retrievalTextExcludesNameAndRole: true,
  };
}

function capabilityDescription(axis) {
  return {
    output: "造成战斗输出的整体能力",
    protection: "通过治疗、护盾、格挡或减伤保护队友的整体能力",
    buff: "给队友提供正面增益、放大队伍的整体能力",
  }[axis] || axis;
}

function confidenceText(count) {
  const value = Number(count || 0);
  if (value >= 10) return "经历很多次战斗形成的熟悉印象";
  if (value >= 4) return "有几次战斗证据";
  if (value >= 1) return "只有少量战斗证据";
  return "没有形成有效印象";
}

main();
