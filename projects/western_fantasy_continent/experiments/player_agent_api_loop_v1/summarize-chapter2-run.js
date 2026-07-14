const fs = require("node:fs");
const path = require("node:path");

const [, , sessionInput, outputInput] = process.argv;
if (!sessionInput) throw new Error("usage: node summarize-chapter2-run.js <session.json> [compact-summary.json]");

const session = JSON.parse(fs.readFileSync(path.resolve(sessionInput), "utf8"));
const summary = {
  schema: "chapter2_playtest_compact_summary_v1",
  seed: session.seed,
  completedCycles: session.cycle,
  phase: session.phase,
  finalEmotion: round(session.cognitionState?.emotion?.value),
  finalTeam: session.gameState?.teamSlots || [],
  clearedNodes: Object.keys(session.gameState?.cleared || {}),
  bossCleared: Boolean(session.gameState?.cleared?.r2_boss),
  inventoryCount: session.gameState?.inventory?.length || 0,
  hypotheses: (session.cognitionState?.hypotheses || []).map((row) => ({
    id: row.id,
    status: row.status,
    target: row.target,
    resultKind: row.resultKind,
    observedValue: row.evidence?.at(-1)?.observedValue ?? null,
  })),
  cycles: (session.history || []).map((row) => ({
    cycle: row.cycle,
    action: row.action,
    outcome: row.outcome,
    emotionBefore: round(row.emotionBeforeDecision),
    emotionAfter: round(row.emotionAfterEvents),
    automaticEmotionDelta: round(row.automaticEmotionDelta),
    duration: round(row.gameEvent?.duration),
    gearBefore: row.gameEvent?.gearBefore ?? null,
    gearAfter: row.gameEvent?.gearAfter ?? null,
    fieldSignalCount: (row.eventLog || []).filter((event) => event.type === "field" || event.result?.kind === "field_effect").length,
    loot: (row.gameEvent?.loot || []).map((item) => ({
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      level: item.level,
      affixCount: item.affixes?.length || 0,
    })),
    contributions: (row.gameEvent?.contributions || []).slice(0, 4).map((unit) => ({
      name: unit.name,
      role: unit.role,
      damage: round(unit.damage),
    })),
  })),
};

const output = `${JSON.stringify(summary, null, 2)}\n`;
if (outputInput) {
  const outputPath = path.resolve(outputInput);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output);
} else {
  process.stdout.write(output);
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}
