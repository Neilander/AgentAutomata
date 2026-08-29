# UFS V19 Fresh Player Results

- Date: 2026-08-29 Asia/Shanghai
- Player profile: `player-v19-fresh.json`
- Player id: `ufs-v19-fresh-player`
- Attempt/state: `state_attempt_2026082919_v19`
- Attention/game seed: `2026082919`
- Recorder: `record-public-step.js`
- Status: blocked by system bug before formal win/loss

## Outcome

The V19 fresh-player attempt did not reach a formal `win` or `loss`.

The attempt passed the required 3-round stage gate, continued in the same unique attempt, and then stopped at sequence `092` during Round 6 while ending the room phase.

Final blocking error:

```text
Error: full attention item ids must be unique
at buildFullItems (.../ufs-full-attention-provider.js:268:11)
```

The final verifier fails for the expected reason:

```text
Error: nonzero exit at 092
```

## Validation

- `node verify-public-evidence.js stage1`: passed.
- `node ../ufs_first_action_imagination_v0/audit-three-round-gate.js . 3`: passed.
- `node verify-public-evidence.js final`: failed at `092` because the CLI exited nonzero after the full-attention duplicate item id error.

Machine record summary:

- total records: 92
- accepted non-rejected records: 87
- public rejected records: 4
- nonzero CLI exits: 1, at `092`

## Rejections Before the System Bug

These were recorded and recovered without mutating the formal game state:

- `005`: prediction used an invalid broad item id.
- `074`: prediction expectation used the wrong schema shape.
- `078`: prediction used unscoped `excavator` item id.
- `083`: attempted to place `r6-gray-1` at `A-r2-c4`; the formal engine rejected the placement.

The useful observation is that bad prediction tickets and bad/illegal actions are being rejected explicitly instead of silently corrupting the attempt.

## Important Evidence From Play

- V18's blocker did not recur: `choose_research_advance` exposed a public self-describing contract with required `advanceSteps`.
- The 3-round gate passed before any Round 4 dice were submitted.
- The formal world corrected player assumptions. Example: the player sometimes saw incomplete ship information, but the formal state still advanced damage and mothership effects.
- `excavate` worked as the actual depth-progress operation in Round 6:
  - before `086`: `excavatorIndex = 0`
  - after `086`: `excavatorIndex = 1`
- Resolving tunnel rooms did not itself increase excavator depth, which is a useful learned distinction.
- The player reached Round 6 with weak strategic position:
  - `damage = 4` before room resolution completion
  - `energy = 0` after research resolution
  - `researchIndex = 6`
  - `excavatorIndex = 1`
  - `mothershipRow = 8`

## Current Diagnosis

The formal play pipeline is mostly working through multi-round play:

`public observation -> contracted operation -> formal engine -> public observation -> prediction evidence`

The blocker is now lower-level attention-state construction after several rounds, not the public contract system and not the research-choice V18 issue.

## Recommended Next Step

Fix the duplicate full-attention item id generation in `ufs-full-attention-provider.js`, then resume with a new fresh V20 attempt. Do not continue this V19 attempt after patching, because sequence `092` is already a clean blocker record.
