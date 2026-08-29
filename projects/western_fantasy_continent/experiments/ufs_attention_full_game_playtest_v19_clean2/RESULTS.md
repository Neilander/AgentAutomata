# UFS V19 Clean2 Fresh Player Final Results

- Date: 2026-08-29 Asia/Shanghai
- Player profile: `player-v19-fresh.json`
- Player id: `ufs-v19-fresh-player`
- Attempt/state: `state_attempt_2026082919_v19`
- Attention/game seed: `2026082919`
- Recorder: `record-public-step.js`
- Status: complete / formal loss

## Outcome

The clean V19 rerun reached a formal outcome at sequence `177`.

```json
{
  "result": "loss",
  "reason": "mothership_reached_skull_row",
  "round": 7
}
```

Final public state:

- phase: `lost`
- damage: 5
- energy: 6
- researchIndex: 9
- excavatorIndex: 19
- mothershipRow: 11

## Validation

- `node verify-public-evidence.js stage1`: passed.
- `node ../ufs_first_action_imagination_v0/audit-three-round-gate.js . 3`: passed.
- `node verify-public-evidence.js final`: passed.

Final verifier summary:

- records: 177
- deliberate actions: 158
- explicit prediction actions: 158
- prediction coverage: 1.0
- completed rounds: 7
- outcome: loss by `mothership_reached_skull_row`

## Why This Rerun Exists

The original V19 attempt is preserved as a blocker sample: it stopped at sequence `092` with a historical `full attention item ids must be unique` error. Current code no longer reproduces that failure from the same checkpoint and payload, and the relevant full-attention/full-game regression tests pass.

Because the original V19 ledger contains a nonzero-exit record, it cannot be reused as final-passing evidence. This `clean2` directory is the clean verified rerun.

## Important Evidence

- The V18 research-choice blocker is resolved: `choose_research_advance` exposes and accepts bounded `advanceSteps`.
- The three-round gate is valid and restorable.
- The attempt continues after the gate in the same state.
- The formal host remains authoritative: rejected placements do not mutate the board.
- Player-facing predictions are present on every deliberate action.
- The formal game reaches a real rules terminal state.

## Strategy Quality

The public automated chooser was intentionally simple and not a strong player. It over-probed visible but illegal placements, causing 67 public `rejected` records, all with zero process exit.

It nevertheless showed the system can continue through noisy player mistakes. The final loss is mostly strategic:

- mothership pressure was not controlled fast enough;
- research reached only 9 before the mothership hit the skull row;
- many actions were spent discovering invalid placements;
- the player developed energy and excavation late, but not enough to win.

## Current Diagnosis

The requested full-game pipeline is now demonstrated end to end:

`fresh player -> public attention -> contracted action -> formal host -> public feedback/prediction evidence -> three-round gate -> continued full game -> formal win/loss`

The next useful work is not another plumbing test; it is chooser quality:

- expose clearer legal placement candidates, or
- improve the player’s legality inference before it submits placement actions.
