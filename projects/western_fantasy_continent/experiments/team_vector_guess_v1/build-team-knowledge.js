const fs = require("fs");
const path = require("path");

const GAME_DATA = path.resolve(__dirname, "..", "..", "game_data");
const SKILL_DATA = require(path.join(GAME_DATA, "skill-data"));
const COMBAT = require(path.join(GAME_DATA, "combat-sim"));
const COMBAT_SIGNALS = require(path.join(GAME_DATA, "combat-signals"));
const INFORMATION_PARSER = require(path.resolve(
  __dirname,
  "..",
  "player_agent_api_loop_v1",
  "battle-information-parser",
));

const SCHEMA = "team_vector_knowledge_v1";
const TEAM_COUNT = 50;
const PERCEPTION_LEVEL = "ordinary";
const KNOWLEDGE_SEED = "team-vector-knowledge-v1";
const VALIDATION_SEED = "team-vector-validation-v1";
const OUT_DIR = path.join(__dirname, "artifacts");
const OUT_FILE = path.join(OUT_DIR, "team-vector-knowledge.json");

const OPPONENTS = Object.freeze([
  Object.freeze({ id: "lightningTempo", label: "急速节奏", probe: "启动速度与普攻节奏" }),
  Object.freeze({ id: "poisonBloom", label: "毒巢滚雪球", probe: "毒与持续伤害" }),
  Object.freeze({ id: "holySustain", label: "圣盾续航", probe: "治疗、护盾与长期作战" }),
  Object.freeze({ id: "fireBurst", label: "余烬爆燃", probe: "爆发与群体伤害" }),
  Object.freeze({ id: "frostControl", label: "霜控拖延", probe: "控制、减速与拖延" }),
  Object.freeze({ id: "shadowExecute", label: "暗影处决", probe: "集火、单点与处决" }),
]);

const AXES = Object.freeze([
  Object.freeze({ id: "damage", label: "伤害", description: "持续对敌人造成总体战斗伤害并压低敌方生命" }),
  Object.freeze({ id: "protection", label: "保护", description: "通过治疗和护盾保护队友并让队伍存活" }),
  Object.freeze({ id: "buff", label: "增益", description: "强化队友并放大全队能力" }),
  Object.freeze({ id: "tempo", label: "启动", description: "快速启动并在战斗前期形成有效压力" }),
  Object.freeze({ id: "burst", label: "爆发", description: "在很短时间内集中造成大量爆发伤害" }),
  Object.freeze({ id: "sustained_damage", label: "持续伤害", description: "依靠毒、灼烧或稳定输出长时间磨掉敌人生命" }),
  Object.freeze({ id: "area_damage", label: "群体伤害", description: "同时攻击多个敌人并快速清理成群目标" }),
  Object.freeze({ id: "control", label: "控制", description: "减速、冻结或限制敌人行动，为队伍争取时间" }),
  Object.freeze({ id: "execution", label: "单点处决", description: "集中攻击危险目标并快速完成单点击杀" }),
]);

const AREA_SKILLS = new Set([
  "arrowStorm",
  "grandMixture",
  "meteorRain",
  "plagueOffering",
  "boneWhirl",
]);
const EXECUTE_SKILLS = new Set(["shadowHarvest", "deathNeedle", "aa2FinisherCut"]);
const CONTROL_TAGS = new Set(["control", "slow", "stun", "freeze", "root", "taunt"]);

function main() {
  const teams = generateTeams(TEAM_COUNT, KNOWLEDGE_SEED);
  const knowledgeRun = runMatrix(teams, KNOWLEDGE_SEED, true);
  const validationRun = runMatrix(teams, VALIDATION_SEED, false);
  const knowledgeVectors = buildRelativeVectors(teams, knowledgeRun.cells);
  const validationVectors = buildRelativeVectors(teams, validationRun.cells);
  const payload = {
    schema: SCHEMA,
    generatedAt: new Date().toISOString(),
    policy: {
      teamSampling: "ordered four-slot canonical-role sampling with replacement; candidate teams are unique",
      repeatedRolesAllowed: true,
      roleSkills: "canonical role kit only in V1",
      knowledgeInput: "all renderer-visible combat signals; hidden design metadata is excluded",
      declarativeAudit: `battle information parser at ${PERCEPTION_LEVEL} perception`,
      vectorRule: "opponent-local percentile -> six-context aggregation -> top-30-percent zero boundary",
      queryRule: "natural-language requirement direction dot unnormalized team cognition vector",
      rawSignalStorage: "streamed into summaries; only compact audit evidence is persisted",
    },
    axes: AXES,
    opponents: OPPONENTS,
    teams,
    knowledge: {
      seed: KNOWLEDGE_SEED,
      battleCount: knowledgeRun.cells.length,
      rawSignalCount: knowledgeRun.rawSignalCount,
      visibleSignalCount: knowledgeRun.visibleSignalCount,
      cells: knowledgeRun.cells,
      vectors: knowledgeVectors,
    },
    heldOutValidation: {
      seed: VALIDATION_SEED,
      battleCount: validationRun.cells.length,
      rawSignalCount: validationRun.rawSignalCount,
      visibleSignalCount: validationRun.visibleSignalCount,
      cells: validationRun.cells.map(compactValidationCell),
      vectors: validationVectors,
    },
    audits: buildAudits(teams, knowledgeRun.cells, knowledgeVectors),
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: path.relative(process.cwd(), OUT_FILE),
    teams: teams.length,
    battles: knowledgeRun.cells.length + validationRun.cells.length,
    knowledgeSignals: knowledgeRun.rawSignalCount,
    visibleKnowledgeSignals: knowledgeRun.visibleSignalCount,
    repeatedRoleTeams: teams.filter((team) => new Set(team.roles).size < 4).length,
    allSameRoleTeams: teams.filter((team) => new Set(team.roles).size === 1).length,
  }, null, 2));
}

function generateTeams(count, seedText) {
  const roles = Object.keys(SKILL_DATA.roleKits || {}).sort();
  const fixtures = [
    { roles: ["mage", "mage", "mage", "mage"], source: "edge_fixture_all_same" },
    { roles: ["priest", "priest", "priest", "priest"], source: "edge_fixture_all_same" },
    { roles: ["knight", "priest", "mage", "ranger"], source: "edge_fixture_order" },
    { roles: ["mage", "priest", "knight", "ranger"], source: "edge_fixture_reordered" },
  ];
  const rng = seededRandom(seedText);
  const rows = [];
  const seen = new Set();
  for (const fixture of fixtures) addTeam(fixture.roles, fixture.source);
  while (rows.length < count) {
    const sampled = Array.from({ length: 4 }, () => roles[Math.floor(rng() * roles.length)]);
    addTeam(sampled, "random_with_replacement");
  }
  return rows;

  function addTeam(teamRoles, source) {
    const key = teamRoles.join(">");
    if (seen.has(key)) return;
    seen.add(key);
    const id = `team-${String(rows.length + 1).padStart(3, "0")}`;
    rows.push({
      id,
      source,
      roles: [...teamRoles],
      roleNames: teamRoles.map((role) => SKILL_DATA.roleKits[role]?.role || role),
      label: teamRoles.map((role) => SKILL_DATA.roleKits[role]?.role || role).join(" / "),
      fingerprint: key,
    });
  }
}

function runMatrix(teams, seedRoot, keepKnowledge) {
  const cells = [];
  let rawSignalCount = 0;
  let visibleSignalCount = 0;
  for (const team of teams) {
    for (const opponent of OPPONENTS) {
      const result = COMBAT.simulateTeams(
        buildCombatTeam(team),
        COMBAT.clonePreset(opponent.id),
        {
          seed: `${seedRoot}|${team.id}|${opponent.id}`,
          randomizeStats: false,
          maxTime: 75,
          healthInterval: 0.5,
        },
      );
      const semanticEvents = toVisibleSemanticEvents(result, team, opponent);
      const reception = INFORMATION_PARSER.selectReceivedCandidatesForOrganizer(
        semanticEvents,
        {
          seed: `${seedRoot}|${team.id}|${opponent.id}|perception`,
          perceptionLevel: PERCEPTION_LEVEL,
        },
      );
      rawSignalCount += result.signals.length;
      visibleSignalCount += semanticEvents.length - 1;
      const metrics = summarizeTeamSignals(semanticEvents, result.duration);
      cells.push({
        id: `${team.id}__${opponent.id}`,
        subject: {
          type: "ordered_team",
          id: team.id,
          fingerprint: team.fingerprint,
          slots: team.roles.map((role, index) => ({ slot: index + 1, role })),
        },
        environment: {
          type: "fixed_opponent_team",
          id: opponent.id,
          label: opponent.label,
          probe: opponent.probe,
        },
        behavior: {
          kind: "fight_with_ordered_formation",
          formation: team.fingerprint,
        },
        result: {
          outcome: result.winner === "left" ? "win" : "loss",
          duration: result.duration,
          ownHp: result.leftHp,
          enemyHp: result.rightHp,
          ownAlive: result.metrics.leftAlive,
          enemyAlive: result.metrics.rightAlive,
        },
        signalSummary: metrics,
        receivedKnowledge: keepKnowledge ? {
          perceptionLevel: PERCEPTION_LEVEL,
          receivedStatementCount: reception.selected.length,
          statements: reception.selected.map((row) => row.statement),
          receivedEvidenceCount: uniqueEvidence(reception.selected).length,
        } : undefined,
        evidenceAudit: keepKnowledge && keepDetailedAudit(team.id)
          ? compactEvidence(semanticEvents, 14)
          : undefined,
      });
    }
  }
  return { cells, rawSignalCount, visibleSignalCount };
}

function buildCombatTeam(team) {
  return team.roles.map((role, index) => {
    const row = SKILL_DATA.roleKits[role];
    return {
      id: `${team.id}:slot-${index + 1}`,
      role,
      roleName: row.role,
      name: `${row.name}${index + 1}`,
      slotIndex: index,
      ...row.kit,
    };
  });
}

function toVisibleSemanticEvents(result, team, opponent) {
  const events = (result.signals || []).map((signal, index) => ({
    id: `${team.id}:${opponent.id}:combat:${index + 1}`,
    sequence: index + 1,
    time: round(signal.time),
    type: signal.kind,
    subject: clone(signal.source),
    environment: {
      region: "team_vector_experiment",
      node: opponent.id,
      nodeType: "fixed_team_probe",
      phase: "combat",
    },
    behavior: {
      kind: signal.kind === "skill" ? "skill_cast" : signal.skillKey ? "skill_effect" : signal.kind,
      key: signal.skillKey || signal.kind,
      name: signal.text || signal.skillName || signal.skillKey || signal.kind,
      tags: [...(signal.tags || [])],
    },
    result: {
      kind: signal.kind,
      amount: round(signal.amount || 0),
      target: clone(signal.target),
      hpBefore: Number.isFinite(signal.hpBefore) ? round(signal.hpBefore) : null,
      hpAfter: Number.isFinite(signal.hpAfter) ? round(signal.hpAfter) : null,
      occurred: true,
      meta: clone(signal.meta || {}),
    },
    presentation: COMBAT_SIGNALS.describePresentation(signal),
  })).filter((event) => event.presentation.visible);
  events.push({
    id: `${team.id}:${opponent.id}:combat-result`,
    sequence: events.length + 1,
    time: round(result.duration),
    type: "combat_result",
    subject: { id: team.id, name: team.label, side: "left", role: "team" },
    environment: {
      region: "team_vector_experiment",
      node: opponent.id,
      nodeType: "fixed_team_probe",
      phase: "settlement",
    },
    behavior: { kind: "combat", key: "fight", name: "完成战斗", tags: ["combat"] },
    result: {
      kind: result.winner === "left" ? "combat_win" : "combat_loss",
      outcome: result.winner === "left" ? "win" : "loss",
      won: result.winner === "left",
      survivors: { ally: result.metrics.leftAlive, enemy: result.metrics.rightAlive },
      occurred: true,
    },
    presentation: {
      visible: true,
      informationContract: COMBAT_SIGNALS.INFORMATION_PRESENTATION_CONTRACT.schema,
      informationTier: "blocking",
      blocking: true,
      hasText: true,
      hasAnimation: true,
      attentionZone: "battle_result",
    },
  });
  return events;
}

function summarizeTeamSignals(events, durationInput) {
  const duration = Math.max(0.001, Number(durationInput) || 0.001);
  const combatEvents = events.filter((event) => event.type !== "combat_result");
  const outgoingDamage = combatEvents.filter((event) => (
    event.type === "damage"
    && event.subject?.side === "left"
    && event.result?.target?.side === "right"
    && Number(event.result?.amount) > 0
  ));
  const healing = combatEvents.filter((event) => event.type === "heal" && event.subject?.side === "left");
  const shielding = combatEvents.filter((event) => event.type === "shield" && event.subject?.side === "left");
  const buffs = combatEvents.filter((event) => event.subject?.side === "left" && hasAnyTag(event, ["buff", "haste", "empower"]));
  const dots = outgoingDamage.filter((event) => hasAnyTag(event, ["dot", "poison", "burn"]));
  const area = outgoingDamage.filter((event) => (
    hasAnyTag(event, ["area", "splash"])
    || AREA_SKILLS.has(event.behavior?.key)
  ));
  const execute = outgoingDamage.filter((event) => (
    hasAnyTag(event, ["execute", "finisher"])
    || EXECUTE_SKILLS.has(event.behavior?.key)
  ));
  const control = combatEvents.filter((event) => (
    event.subject?.side === "left"
    && [...CONTROL_TAGS].some((tag) => (event.behavior?.tags || []).includes(tag))
  ));
  const deaths = combatEvents.filter((event) => event.type === "death" && event.result?.target?.side === "right");
  const ultimate = combatEvents.filter((event) => event.subject?.side === "left" && hasAnyTag(event, ["ultimate"]));
  const totalDamage = sumAmounts(outgoingDamage);
  const earlyDamage = sumAmounts(outgoingDamage.filter((event) => event.time <= 5));
  const lateDamage = sumAmounts(outgoingDamage.filter((event) => event.time >= duration / 2));
  const firstUltimate = minimumTime(ultimate, duration + 5);
  const firstKill = minimumTime(deaths, duration + 5);
  const peak2sDamage = peakWindowAmount(outgoingDamage, duration, 2);
  const targetTotals = groupAmounts(outgoingDamage, (event) => event.result?.target?.id || "unknown");
  const targetConcentration = totalDamage > 0
    ? Math.max(0, ...Object.values(targetTotals)) / totalDamage
    : 0;
  const earlyPressure = earlyDamage / 5;
  const ultimateReadiness = Math.max(0, 1 - firstUltimate / Math.max(duration + 5, 1));
  const firstKillReadiness = Math.max(0, 1 - firstKill / Math.max(duration + 5, 1));
  return {
    evidence: {
      outgoingDamageEvents: outgoingDamage.length,
      healingEvents: healing.length,
      shieldingEvents: shielding.length,
      buffEvents: buffs.length,
      dotEvents: dots.length,
      areaEvents: area.length,
      controlEvents: control.length,
      executeEvents: execute.length,
      enemyKillEvents: deaths.length,
      ultimateEvents: ultimate.length,
    },
    rawAxes: {
      damage: round(totalDamage / duration),
      protection: round((sumAmounts(healing) + sumAmounts(shielding)) / duration),
      buff: round((sumAmounts(buffs) + buffs.length * 10) / duration),
      tempo: round(earlyPressure + 80 * ultimateReadiness + 80 * firstKillReadiness),
      burst: round(peak2sDamage / 2),
      sustained_damage: round(sumAmounts(dots) / duration + (lateDamage / Math.max(duration / 2, 0.001)) * 0.35),
      area_damage: round(sumAmounts(area) / duration),
      control: round(control.length / duration * 100),
      execution: round(sumAmounts(execute) / duration + targetConcentration * (totalDamage / duration) * 0.25 + firstKillReadiness * 40),
    },
    interpretable: {
      totalDamage: round(totalDamage),
      damagePerSecond: round(totalDamage / duration),
      healing: round(sumAmounts(healing)),
      shielding: round(sumAmounts(shielding)),
      dotDamage: round(sumAmounts(dots)),
      areaDamage: round(sumAmounts(area)),
      earlyDamageShare: round(totalDamage > 0 ? earlyDamage / totalDamage : 0),
      lateDamageShare: round(totalDamage > 0 ? lateDamage / totalDamage : 0),
      peak2sDamage: round(peak2sDamage),
      firstUltimate: Number.isFinite(firstUltimate) && firstUltimate <= duration ? round(firstUltimate) : null,
      firstEnemyKill: Number.isFinite(firstKill) && firstKill <= duration ? round(firstKill) : null,
      targetConcentration: round(targetConcentration),
    },
  };
}

function buildRelativeVectors(teams, cells) {
  const cellByTeam = groupBy(cells, (cell) => cell.subject.id);
  const opponentPercentiles = {};
  for (const opponent of OPPONENTS) {
    const opponentCells = cells.filter((cell) => cell.environment.id === opponent.id);
    opponentPercentiles[opponent.id] = {};
    for (const axis of AXES) {
      opponentPercentiles[opponent.id][axis.id] = percentileMap(
        opponentCells,
        (cell) => cell.signalSummary.rawAxes[axis.id],
        (cell) => cell.subject.id,
      );
    }
  }
  const aggregate = teams.map((team) => {
    const teamCells = cellByTeam.get(team.id) || [];
    const axes = {};
    for (const axis of AXES) {
      const contextValues = teamCells.map((cell) => ({
        opponent: cell.environment.id,
        percentile: opponentPercentiles[cell.environment.id][axis.id][team.id],
        raw: cell.signalSummary.rawAxes[axis.id],
      }));
      axes[axis.id] = {
        preBoundaryPosition: round(average(contextValues.map((row) => row.percentile))),
        confidence: round(1 - Math.exp(-contextValues.length / 3)),
        contextCount: contextValues.length,
        contexts: contextValues,
      };
    }
    return { teamId: team.id, fingerprint: team.fingerprint, axes };
  });
  for (const axis of AXES) {
    const positions = aggregate.map((row) => row.axes[axis.id].preBoundaryPosition);
    const boundary = quantile(positions, 0.7);
    const min = Math.min(...positions);
    const max = Math.max(...positions);
    for (const row of aggregate) {
      const position = row.axes[axis.id].preBoundaryPosition;
      const coordinate = position >= boundary
        ? (position - boundary) / Math.max(0.0001, max - boundary)
        : -(boundary - position) / Math.max(0.0001, boundary - min);
      row.axes[axis.id] = {
        ...row.axes[axis.id],
        topThirtyBoundary: round(boundary),
        coordinate: round(coordinate),
        inTopThirtyPercent: position >= boundary,
      };
    }
  }
  return aggregate.map((row) => {
    const ordered = AXES.map((axis) => row.axes[axis.id].coordinate);
    const strongest = AXES.slice()
      .filter((axis) => row.axes[axis.id].coordinate > 0.05)
      .sort((a, b) => row.axes[b.id].coordinate - row.axes[a.id].coordinate)
      .slice(0, 3);
    const strongestIds = new Set(strongest.map((axis) => axis.id));
    const weakest = AXES.slice()
      .filter((axis) => row.axes[axis.id].coordinate < -0.05 && !strongestIds.has(axis.id))
      .sort((a, b) => row.axes[a.id].coordinate - row.axes[b.id].coordinate)
      .slice(0, 2);
    return {
      ...row,
      coordinateOrder: AXES.map((axis) => axis.id),
      vector: ordered,
      learnedSummary: `相对突出：${strongest.length ? strongest.map((axis) => axis.label).join("、") : "暂无明确方向"}；相对薄弱：${weakest.length ? weakest.map((axis) => axis.label).join("、") : "暂无明确方向"}`,
    };
  });
}

function buildAudits(teams, cells, vectors) {
  const repeated = teams.filter((team) => new Set(team.roles).size < team.roles.length);
  const allSame = teams.filter((team) => new Set(team.roles).size === 1);
  const ids = new Set();
  let stableIds = true;
  for (const cell of cells) {
    const expectedPrefix = `${cell.subject.id}:slot-`;
    for (const evidence of cell.evidenceAudit || []) {
      if (evidence.subject?.side === "left" && evidence.subject?.id) {
        ids.add(evidence.subject.id);
        if (!String(evidence.subject.id).startsWith(expectedPrefix)) stableIds = false;
      }
    }
  }
  const orderA = vectors.find((row) => row.teamId === "team-003");
  const orderB = vectors.find((row) => row.teamId === "team-004");
  return {
    repeatedRoleTeamCount: repeated.length,
    allSameRoleTeamCount: allSame.length,
    repeatedExamples: repeated.slice(0, 8).map((team) => ({ id: team.id, fingerprint: team.fingerprint })),
    stableSlotIdentity: stableIds,
    observedFriendlyIdentityCount: ids.size,
    reorderedPair: {
      first: teams.find((team) => team.id === "team-003"),
      second: teams.find((team) => team.id === "team-004"),
      maxVectorDifference: round(Math.max(...orderA.vector.map((value, index) => Math.abs(value - orderB.vector[index])))),
      treatedAsDistinct: orderA.fingerprint !== orderB.fingerprint,
    },
  };
}

function compactValidationCell(cell) {
  return {
    id: cell.id,
    subject: cell.subject,
    environment: cell.environment,
    result: cell.result,
    signalSummary: cell.signalSummary,
  };
}

function keepDetailedAudit(teamId) {
  return Number(String(teamId).split("-")[1]) <= 8;
}

function compactEvidence(events, limit) {
  const priority = events.filter((event) => event.type !== "combat_result").sort((a, b) => {
    const scoreA = evidencePriority(a);
    const scoreB = evidencePriority(b);
    return scoreB - scoreA || a.time - b.time;
  });
  return priority.slice(0, limit).map((event) => ({
    id: event.id,
    time: event.time,
    type: event.type,
    subject: clone(event.subject),
    target: clone(event.result?.target),
    behavior: event.behavior?.name,
    tags: [...(event.behavior?.tags || [])],
    amount: event.result?.amount || 0,
    informationTier: event.presentation?.informationTier,
  }));
}

function evidencePriority(event) {
  const tier = { blocking: 7, highlight: 6, prominent: 5, standard_high: 4, standard: 3, standard_low: 2, ambient: 1, background: 0 };
  return (tier[event.presentation?.informationTier] || 0) * 100
    + (event.type === "death" ? 80 : 0)
    + (hasAnyTag(event, ["ultimate"]) ? 50 : 0)
    + Math.min(40, Number(event.result?.amount || 0) / 10);
}

function uniqueEvidence(candidates) {
  const rows = new Map();
  for (const candidate of candidates) {
    for (const event of candidate.evidence || []) rows.set(event.id, event);
  }
  return [...rows.values()];
}

function percentileMap(rows, valueOf, idOf) {
  const sorted = rows.map((row) => ({ id: idOf(row), value: Number(valueOf(row)) || 0 }))
    .sort((a, b) => a.value - b.value || a.id.localeCompare(b.id));
  const output = {};
  let index = 0;
  while (index < sorted.length) {
    let end = index + 1;
    while (end < sorted.length && sorted[end].value === sorted[index].value) end += 1;
    const averageRank = (index + end - 1) / 2;
    const percentile = sorted.length <= 1 ? 0.5 : averageRank / (sorted.length - 1);
    for (let cursor = index; cursor < end; cursor += 1) output[sorted[cursor].id] = percentile;
    index = end;
  }
  return output;
}

function peakWindowAmount(events, duration, window) {
  let best = 0;
  for (let start = 0; start <= duration; start += 0.5) {
    best = Math.max(best, sumAmounts(events.filter((event) => event.time >= start && event.time < start + window)));
  }
  return best;
}

function minimumTime(events, fallback) {
  return events.length ? Math.min(...events.map((event) => Number(event.time) || 0)) : fallback;
}

function sumAmounts(events) {
  return events.reduce((sum, event) => sum + Number(event.result?.amount || 0), 0);
}

function groupAmounts(rows, keyOf) {
  const output = {};
  for (const row of rows) {
    const key = keyOf(row);
    output[key] = (output[key] || 0) + Number(row.result?.amount || 0);
  }
  return output;
}

function groupBy(rows, keyOf) {
  const output = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    if (!output.has(key)) output.set(key, []);
    output.get(key).push(row);
  }
  return output;
}

function hasAnyTag(event, tags) {
  const actual = new Set(event.behavior?.tags || []);
  return tags.some((tag) => actual.has(tag));
}

function quantile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const position = (sorted.length - 1) * ratio;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0;
}

function seededRandom(seedText) {
  let state = hash32(seedText) || 0x6d2b79f5;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hash32(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

if (require.main === module) main();

module.exports = {
  AXES,
  OPPONENTS,
  generateTeams,
  runMatrix,
  buildCombatTeam,
  toVisibleSemanticEvents,
  summarizeTeamSignals,
  buildRelativeVectors,
};
