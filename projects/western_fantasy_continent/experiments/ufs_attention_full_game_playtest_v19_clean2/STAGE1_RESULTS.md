# UFS V19 Clean2 Stage 1 Results

- Date: 2026-08-29 Asia/Shanghai
- Player profile: `player-v19-fresh.json`
- Player id: `ufs-v19-fresh-player`
- Attempt/state: `state_attempt_2026082919_v19`
- Attention/game seed: `2026082919`
- Status: passed

## Gate Position

The clean V19 rerun reached the required three-round boundary at sequence `082`.

- public status: `random`
- public reason: `waiting_for_next_round_roll`
- pending round: `4`
- completed rounds: `3`
- formal outcome: none

## Validation

- `node verify-public-evidence.js stage1`: passed
  - records: 82
  - deliberate actions: 73
  - explicit prediction actions: 73
  - prediction coverage: 1.0
- `node ../ufs_first_action_imagination_v0/audit-three-round-gate.js . 3`: passed
  - `stageGatePassed: true`
  - restored host: round 3, phase `new_round`, energy 5, damage 0, researchIndex 3, excavatorIndex 3, mothershipRow 5

## Notes

The automated public strategy generated many formal placement rejections while probing visible-but-illegal placements. These were zero-exit public rejections and did not mutate the formal board. They are evidence of a weak chooser, not a stage-gate system failure.
