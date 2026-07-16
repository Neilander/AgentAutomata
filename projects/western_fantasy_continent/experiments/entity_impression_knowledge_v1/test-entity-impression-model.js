const assert = require("assert");
const MODEL = require("./entity-impression-model");
const { createPresetReports } = require("./preset-battle-reports");

const reports = createPresetReports();
const reportById = new Map(reports.map((report) => [report.id, report]));

const first = MODEL.analyzeBattleReport(reportById.get("battle_1_weak_swarm"), { profile: "ordinary" });
const firstWarrior = first.units.find((unit) => unit.id === "hero_warrior");
assert(firstWarrior.strength.level >= 7, "warrior should dominate the weak-swarm team baseline");
assert(firstWarrior.traits.some((trait) => trait.domain === "area_damage"), "warrior should expose an area-damage trait");

const contributionProbe = MODEL.analyzeBattleReport({
  id: "contribution_probe",
  environment: { tags: ["probe"] },
  playerTeam: [
    { id: "probe_a", name: "A", role: "hybrid" },
    { id: "probe_b", name: "B", role: "damage" },
  ],
  gameEvent: { outcome: "win" },
  eventLog: [
    { id: "d1", type: "damage", time: 1, subject: { id: "probe_a", side: "left" }, behavior: { tags: [] }, result: { target: { id: "e1", side: "right" }, hpBefore: 30, hpAfter: 0, amount: 999, meta: { visibleTargetCount: 1 } } },
    { id: "h1", type: "heal", time: 2, subject: { id: "probe_a", side: "left" }, behavior: { tags: [] }, result: { target: { id: "probe_a", side: "left" }, hpBefore: 90, hpAfter: 100, amount: 100 } },
    { id: "s0", type: "shield", time: 3, subject: { id: "probe_a", side: "left" }, behavior: { tags: [] }, result: { target: { id: "probe_a", side: "left" }, amount: 999 } },
    { id: "s1", type: "shield_absorb", time: 4, subject: { id: "probe_a", side: "left" }, behavior: { tags: [] }, result: { target: { id: "probe_a", side: "left" }, amount: 20 } },
    { id: "p1", type: "damage_prevented", time: 5, subject: { id: "probe_a", side: "left" }, behavior: { tags: [] }, result: { target: { id: "probe_a", side: "left" }, amount: 5 } },
    { id: "c1", type: "control_prevented_action", time: 6, subject: { id: "probe_a", side: "left" }, behavior: { tags: [] }, result: { target: { id: "e1", side: "right" }, amount: 4 } },
    { id: "k1", type: "death", time: 7, subject: { id: "probe_a", side: "left" }, behavior: { tags: [] }, result: { target: { id: "e1", side: "right" }, amount: 500 } },
    { id: "d2", type: "damage", time: 8, subject: { id: "probe_b", side: "left" }, behavior: { tags: [] }, result: { target: { id: "e2", side: "right" }, hpBefore: 20, hpAfter: 10, amount: 10, meta: { visibleTargetCount: 1 } } },
  ],
}, { profile: "expert" });
const probeA = contributionProbe.units.find((unit) => unit.id === "probe_a");
assert.deepStrictEqual(probeA.channels, { damage: 30, healing: 10, shieldAbsorbed: 20, damagePrevented: 5, controlValue: 4 });
assert.strictEqual(probeA.usefulContribution, 69, "overkill, overheal, unused shields, and death events must not double count");
assert.strictEqual(contributionProbe.teamUsefulContribution, 79);
assert.strictEqual(contributionProbe.expectedUnitContribution, 39.5);
assert.strictEqual(probeA.relativeStrengthPercent, 74.684);

assert.strictEqual(MODEL.scoreDomainEvidence({ high: 0, medium: 0, low: 10 }), 0.2);
assert.strictEqual(MODEL.scoreDomainEvidence({ high: 0, medium: 10, low: 0 }), 0.65);
assert.strictEqual(MODEL.scoreDomainEvidence({ high: 3, medium: 0, low: 7 }), 0.44);
assert.strictEqual(MODEL.scoreDomainEvidence({ high: 5, medium: 0, low: 5 }), 0.6);
assert.strictEqual(MODEL.domainEvidenceEligible({ high: 0.599, medium: 0, low: 1 }), false, "unrounded evidence just below 0.50 must remain ineligible");
assert.strictEqual(MODEL.domainEvidenceEligible({ high: 0.6, medium: 0, low: 1 }), true, "exactly 0.50 must be eligible");
assert.strictEqual(MODEL.domainEvidenceEligible({ high: 0.601, medium: 0, low: 1 }), true, "evidence just above 0.50 must be eligible");
assert.deepStrictEqual(MODEL.AGENT_INTERPRETATION_POLICY, {
  output: "hypothesis_only",
  directKnowledgePromotion: false,
  promotionRule: "later structured evidence must validate the hypothesis before code may create knowledge",
});

const armor = MODEL.analyzeBattleReport(reportById.get("battle_3_armored_elite"), { profile: "ordinary" });
const armorWarrior = armor.units.find((unit) => unit.id === "hero_warrior");
assert(armorWarrior.strength.level < 0, "warrior should look weak against the armored elite");

const state = MODEL.createImpressionState({ profile: "ordinary" });
MODEL.ingestBattleAnalysis(state, first);
const mixed = MODEL.analyzeBattleReport(reportById.get("battle_2_mixed_patrol"), { profile: "ordinary" });
MODEL.ingestBattleAnalysis(state, mixed);
MODEL.ingestBattleAnalysis(state, armor);
const warriorStrengthRows = state.knowledge.filter((row) => row.kind === "strength" && row.subject.id === "hero_warrior");
assert.strictEqual(warriorStrengthRows.length, 3, "neutral and negative contradictions must append corrections instead of overwriting the first impression");
assert.strictEqual(warriorStrengthRows[0].relation, "first_impression");
assert.strictEqual(warriorStrengthRows[1].relation, "qualifies");
assert.strictEqual(warriorStrengthRows[1].corrects, warriorStrengthRows[0].id);
assert.strictEqual(warriorStrengthRows[1].claim.level, 0, "ordinary performance after an extreme first impression is meaningful contextual correction evidence");
assert.strictEqual(warriorStrengthRows[2].corrects, warriorStrengthRows[0].id);
assert(warriorStrengthRows[0].primacyWeight > warriorStrengthRows[1].primacyWeight, "earlier knowledge must retain higher default primacy");

const defaultTop = MODEL.retrieveImpressions(state, "hero_warrior").find((row) => row.kind === "strength");
const armorTop = MODEL.retrieveImpressions(state, "hero_warrior", ["elite", "high_armor"]).find((row) => row.kind === "strength");
const swarmTop = MODEL.retrieveImpressions(state, "hero_warrior", ["swarm", "low_armor"]).find((row) => row.kind === "strength");
assert.strictEqual(defaultTop.relation, "synthesizes_observations", "general retrieval should expose a revisable current belief");
assert(defaultTop.claim.level > 0 && defaultTop.claim.level < warriorStrengthRows[0].claim.level,
  "later counterevidence should weaken, but not erase, the biased first impression");
assert.strictEqual(defaultTop.firstImpressionId, warriorStrengthRows[0].id, "current belief must preserve first-impression provenance");
assert.strictEqual(armorTop.relation, "synthesizes_exact_context_observations", "exact high-armor context must retrieve its observed evidence");
assert.strictEqual(armorTop.claim.level, warriorStrengthRows[2].claim.level);
assert.strictEqual(swarmTop.relation, "synthesizes_exact_context_observations", "mixed low-armor correction must not leak into the swarm context");
assert.strictEqual(swarmTop.claim.level, warriorStrengthRows[0].claim.level);
const extraTagTop = MODEL.retrieveImpressions(state, "hero_warrior", ["elite", "high_armor", "boss"]).find((row) => row.kind === "strength");
assert.strictEqual(extraTagTop.relation, "synthesizes_exact_context_observations", "three-tag queries must use the same salient-context normalization as storage");
assert.strictEqual(extraTagTop.claim.level, warriorStrengthRows[2].claim.level);
const unknownContextTop = MODEL.retrieveImpressions(state, "hero_warrior", ["boss"]).find((row) => row.kind === "strength");
assert.strictEqual(unknownContextTop.relation, "synthesizes_observations", "unknown context must use the revisable current belief fallback");

const evidenceBeforeDuplicate = JSON.stringify(state.knowledge);
const duplicateTrace = MODEL.ingestBattleAnalysis(state, armor);
assert.strictEqual(duplicateTrace.changes[0].action, "ignored_duplicate_report");
assert.strictEqual(JSON.stringify(state.knowledge), evidenceBeforeDuplicate, "duplicate report ingestion must not inflate evidence");

const reversed = MODEL.createImpressionState({ profile: "expert" });
MODEL.ingestBattleAnalysis(reversed, MODEL.analyzeBattleReport(reportById.get("battle_3_armored_elite"), { profile: "expert" }));
MODEL.ingestBattleAnalysis(reversed, MODEL.analyzeBattleReport(reportById.get("battle_1_weak_swarm"), { profile: "expert" }));
const reversedGeneral = MODEL.retrieveImpressions(reversed, "hero_warrior").find((row) => row.kind === "strength");
const reversedSwarm = MODEL.retrieveImpressions(reversed, "hero_warrior", ["swarm", "low_armor"]).find((row) => row.kind === "strength");
assert(reversedGeneral.claim.level > 0, "large later counterevidence should be able to revise the current general belief");
assert(reversedGeneral.claim.level < 9, "the earlier weak observation should still constrain the revised belief");
assert(reversedSwarm.claim.level > 0, "later weak-swarm evidence should create a positive contextual correction");

const forwardFull = MODEL.createImpressionState({ profile: "expert" });
for (const report of reports) {
  MODEL.ingestBattleAnalysis(forwardFull, MODEL.analyzeBattleReport(report, { profile: "expert" }));
}
const reversedFull = MODEL.createImpressionState({ profile: "expert" });
for (const reportId of ["battle_3_armored_elite", "battle_4_armored_elite_repeat", "battle_1_weak_swarm", "battle_2_mixed_patrol", "battle_5_low_armor_champion"]) {
  MODEL.ingestBattleAnalysis(reversedFull, MODEL.analyzeBattleReport(reportById.get(reportId), { profile: "expert" }));
}
const forwardCurrent = MODEL.retrieveImpressions(forwardFull, "hero_warrior")[0];
const reversedCurrent = MODEL.retrieveImpressions(reversedFull, "hero_warrior")[0];
assert(forwardCurrent.claim.level > 0 && forwardCurrent.claim.level < 9,
  "repeated counterevidence must revise an extreme first impression");
assert(forwardCurrent.weightedSemanticLevel > reversedCurrent.weightedSemanticLevel,
  "observation order should create finite primacy bias without permanently locking belief");
assert.strictEqual(forwardFull.knowledge[0].claim.level, 9, "immutable first-impression history must not be overwritten");

const neutralThenStrong = MODEL.createImpressionState({ profile: "expert" });
MODEL.ingestBattleAnalysis(neutralThenStrong, MODEL.analyzeBattleReport(reportById.get("battle_2_mixed_patrol"), { profile: "expert" }));
const neutralOnlyBelief = MODEL.retrieveImpressions(neutralThenStrong, "hero_warrior")[0];
assert.strictEqual(neutralOnlyBelief.claim.level, 0, "neutral-only observation history should be retrievable without inventing a salient first impression");
assert.strictEqual(neutralOnlyBelief.firstImpressionId, null);
MODEL.ingestBattleAnalysis(neutralThenStrong, MODEL.analyzeBattleReport(reportById.get("battle_1_weak_swarm"), { profile: "expert" }));
const retainedNeutralContext = MODEL.retrieveImpressions(neutralThenStrong, "hero_warrior", ["mixed", "low_armor"])[0];
assert.strictEqual(retainedNeutralContext.relation, "synthesizes_exact_context_observations");
assert.strictEqual(retainedNeutralContext.claim.level, 0, "retained neutral evidence must win in its exact context after a later strong first impression");
const neutralThenStrongBelief = MODEL.retrieveImpressions(neutralThenStrong, "hero_warrior")[0];
assert.strictEqual(neutralThenStrongBelief.observationCount, 2, "a neutral first observation must affect current belief even though it creates no salient knowledge row");
assert(neutralThenStrongBelief.claim.level < 9, "the retained neutral observation must constrain a later extreme observation");

const expertMixed = MODEL.analyzeBattleReport(reportById.get("battle_2_mixed_patrol"), { profile: "expert" });
const mage = expertMixed.units.find((unit) => unit.id === "hero_mage");
assert(mage.traits.some((trait) => trait.domain === "area_damage" && trait.level >= 3), "expert should classify mage area damage from domain evidence");

console.log(JSON.stringify({
  result: "PASS",
  firstWarriorStrength: firstWarrior.strength,
  armorWarriorStrength: armorWarrior.strength,
  forwardDefault: defaultTop.claim,
  forwardHighArmor: armorTop.claim,
  reversedDefault: reversedGeneral.claim,
  reversedSwarm: reversedSwarm.claim,
  mageTraits: mage.traits,
}, null, 2));
