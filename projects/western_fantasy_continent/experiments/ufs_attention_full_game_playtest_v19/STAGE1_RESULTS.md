# UFS V19 Stage 1 Results

- Date: 2026-08-29 Asia/Shanghai
- Player profile: `player-v19-fresh.json`
- Player id: `ufs-v19-fresh-player`
- Attempt/state: `state_attempt_2026082919_v19`
- Attention seed: `2026082919`
- Status: passed

## Gate Position

The single V19 attempt stopped at sequence `046`, exactly at the Round 4 next-round-roll boundary:

- public status: `random`
- public reason: `waiting_for_next_round_roll`
- pending round: `4`
- completed rounds: `3`
- formal outcome: none yet

No Round 4 dice were submitted before the stage checks.

## Validation

- `node verify-public-evidence.js stage1`: passed
  - records: 46
  - deliberate actions: 40
  - explicit prediction actions: 40
  - prediction coverage: 1.0
- `node ../ufs_first_action_imagination_v0/audit-three-round-gate.js . 3`: passed
  - `stageGatePassed: true`
  - no gate issues
  - restored host: round 3, phase `new_round`, energy 0, damage 0, researchIndex 2, excavatorIndex 0, mothershipRow 4

## Notes

- V18's research-choice public contract blocker did not recur. The public contract exposed `advanceSteps`, including the zero-advance case in Round 1 and a positive bounded choice in Round 2.
- One operation was rejected before state mutation because a prediction expectation used an invalid broad item id. The same intended action was repeated with scoped prediction ids and accepted in the same attempt.
- Strategy after three rounds is weak: research is only 2, energy is 0, excavatorIndex is still 0, and mothershipRow is already 4. This is a strategy/learning sample unless later evidence shows a system contract issue.
