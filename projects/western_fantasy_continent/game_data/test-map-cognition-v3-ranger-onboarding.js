const assert = require("assert");
const CANDIDATE = require("./analyze-map-cognition-v3-ranger-onboarding");

for (let index = 1; index <= 10; index += 1) {
  const seed = `ranger-onboarding-regression-${index}`;
  const result = CANDIDATE.runLoop(seed, 30);
  assert.equal(result.ok, true, `${seed} completes the candidate loop`);
  const actions = result.loop.actions;
  const rescueIndex = actions.findIndex((row) => row.action === "challenge:r1_prison" && row.outcome === "win");
  const swapIndex = actions.findIndex((row) => row.action.startsWith("swap:") && row.action.endsWith(":hero_ranger"));
  const proofIndex = actions.findIndex((row) => row.action === "challenge:r1_main_4");
  const proofEvent = result.loop.gameState.history.find((event) => event.node === "r1_main_4" && event.roleProof?.rangerDamageShare != null);
  const experiment = result.loop.cognitionState.affordanceExperiments.find((row) => row.heroId === "hero_ranger");
  const hypothesis = result.loop.cognitionState.hypotheses.find((row) => row.id === "verify-team-experiment:hero_ranger");

  assert.ok(rescueIndex >= 0, `${seed} rescues Ranger`);
  assert.equal(swapIndex, rescueIndex + 1, `${seed} voluntarily uses Ranger immediately after rescue`);
  assert.equal(proofIndex, swapIndex + 1, `${seed} uses the next combat as the relevant Ranger proof`);
  assert.ok(proofEvent, `${seed} emits Ranger-specific visible role proof`);
  assert.ok(proofEvent.roleProof.rangerDamageShare >= 0.22, `${seed} clears the proof threshold`);
  assert.equal(experiment?.status, "resolved", `${seed} resolves the affordance experiment`);
  assert.equal(hypothesis?.status, "confirmed", `${seed} confirms the independent visible contribution hypothesis`);
  assert.ok(result.loop.terminal, `${seed} reaches a bounded terminal`);
}

console.log("map cognition V3 Ranger onboarding tests passed");
