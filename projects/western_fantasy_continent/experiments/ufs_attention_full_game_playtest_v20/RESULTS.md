# UFS V20 Fresh Player Final Results

- Date: 2026-08-29 Asia/Shanghai
- Player profile: `player-v20-fresh.json`
- Player id: `ufs-v20-fresh-player`
- Attempt/state: `state_attempt_2026082920_v20`
- Seed: `2026082920`
- Recorder: `record-public-step.js`

## Outcome

The full-game playtest reached a formal result.

- Result: loss
- Reason: `mothership_reached_skull_row`
- Loss round: 8
- Final sequence: `125`
- Final state: damage 5, energy 0, excavatorIndex 2, mothershipRow 11, researchIndex 8

## Validation

- `node verify-public-evidence.js stage1`: passed before continuing past Round 3.
- `node ..\ufs_first_action_imagination_v0\audit-three-round-gate.js . 3`: passed before continuing past Round 3.
- `node verify-public-evidence.js final`: passed.

Final verifier output:

- `ok=true`
- `records=125`
- `deliberateActions=106`
- `explicitPredictionActions=106`
- `predictionCoverage=1`
- `completedRoundCount=8`
- `outcome.result=loss`
- `outcome.reason=mothership_reached_skull_row`

## What Worked

- The V20 public operation contract path was sufficient to play from a fresh profile to a formal win/loss without restarting.
- Research-choice contracts exposed `advanceSteps` bounds, so the V18 blocker did not recur.
- Prediction tickets were attached to every successful deliberate action in the final ledger.
- The run produced useful learning cases:
  - high-confidence prediction mismatches from hidden/omitted attention items;
  - invalid deep excavation vs. valid shallow excavation;
  - unaffordable excavation after energy depletion;
  - research rooms becoming useless when energy is zero;
  - mother-ship penalties reversing research progress.

## Main Player Failure Pattern

The player understood the broad economy loop, but failed to keep enough energy and mother-ship control online.

The critical collapse was:

1. It spent energy on research and excavation to reach researchIndex 9.
2. Mother-ship penalties pushed research back to 8.
3. Energy reached 0.
4. Later turns could not pay research, fighter, or excavation costs.
5. Several single-cell / half-complete energy attempts did not produce energy.
6. The mother ship reached row 11 in Round 8 before research could recover.

## Protocol Notes

- No V16-V19 decision state was used.
- No new player profile was generated during the run.
- The same V20 attempt continued from Stage 1 through the formal loss.
- `coop_repo/LATEST.md` and `coop_repo/REPORT_INDEX.md` were intentionally not updated, per V20 protocol.

## Risks / Follow-up

- The public ledger contains only successful formal records. Rejected CLI attempts observed during live play are described in `STAGE1_RESULTS.md`, but are not counted as machine records.
- The attention model can omit decisive cells or ships; this is expected, but the player needs stronger “obvious danger / missing-info query” behavior before spending high dice into risky columns.
- Energy planning needs feedback tuning: incomplete multi-cell energy rooms and zero-energy research/excavation failures should strongly adjust future choice weights.
