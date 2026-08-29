# Agent Handoff: UFS excavation energy guard and staged playtest gate

- Date: 2026-08-28 13:32 Asia/Shanghai
- Agent/thread: root
- Scope: fix V12's negative-energy excavation defect and add a three-round continuation gate
- Status: complete

## User Intent

Fix the current system defect, optimize the long-play pipeline, then let a player agent complete three rounds first; continue the same game only if an independent audit finds no system bug.

## Completed

- Made excavation candidates affordability-aware. The room boundary now publishes `excavationEnergyCost=1`, puts payable targets in `excavationPlacementIds`, and puts blocked targets in `unaffordableExcavationPlacementIds`.
- Added an atomic action-port rejection for excavation at zero energy. A forced illegal submission returns `invalid_action:insufficient_energy_for_excavation:<placementId>` without changing the checkpoint.
- Added nonnegative-energy guards at round input, room payment, energy-room result, and learned excavation-patch commit. Cognitive consequences still come from attention → Q → trajectory → JSON program; the controller only enforces legal resource bounds around the returned patch.
- Added a reusable staged-playtest auditor. It verifies the public ledger, exit codes, negative energy, contradictory excavation candidates, the exact three-round pause boundary, and restores the private host checkpoint before allowing continuation.
- Documented the staged protocol in the UFS first-action README.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-one-round-imagination.js`: affordability candidates and nonnegative-energy enforcement.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-one-round-session.js`: zero-energy candidate and atomic-rejection regression.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/audit-three-round-gate.js`: reusable machine/restore audit gate.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-audit-three-round-gate.js`: safe-gate, negative-energy, and candidate-conflict tests.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: candidate and staged-playtest contracts.

## Validation

- Focused session and audit tests: 12/12 passed.
- Full related Node suites across the cognitive program library, generic imagination pipeline, and UFS continuous player: 123/123 passed.
- `git diff --check`: no whitespace error; repository line-ending warnings only.

## Current State

The V12 path that performed a second excavation at energy zero can no longer recur: it is hidden from legal excavation targets, visible as unaffordable, rejected if forced, and protected by a final nonnegative invariant. A fresh long playtest can now be stopped after exactly three completed rounds and independently certified before the same attempt continues.

## Unresolved

- The new staged gate has unit coverage but has not yet been exercised on a fresh agent-created three-round evidence directory.
- Candidate affordability is a public action-port legality fact; it does not guarantee the strategy agent will make a strong choice.
- The complete game after the gate remains untested on this corrected runtime.

## Recommended Next Step

Run one new strong-model V13 attempt with a unique seed, pause after exactly three completed rounds, run `audit-three-round-gate.js`, and resume that same checkpoint only when `stageGatePassed=true`.
