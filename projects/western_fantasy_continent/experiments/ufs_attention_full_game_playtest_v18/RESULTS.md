# UFS V18 Fresh-Player Prediction-Learning Playtest

- Date: 2026-08-29 00:29 Asia/Shanghai
- Player profile: `player-v18-fresh.json`
- Player id: `ufs-v18-fresh-player`
- Attempt/state: `state_attempt_2026082918_v18`
- Attention seed: `2026082918`
- Final status: blocked, no formal win/loss

## Summary

V18 began from the new isolated player-profile flow and used only `record-public-step.js` for all recorded operations. The attempt produced 17 machine records and stopped in Round 1 during the first research-room effect choice.

The run did not reach Stage 1, did not pass the three-round gate, and did not continue to a formal win/loss.

## What Worked

- The fresh player profile loaded and the public response included `playerId`, `episodeId`, and profile revision `0`.
- The formal host remained authoritative: rejected operations did not mutate the board.
- Regular die placement, white-die random boundaries, and the two-cell energy room worked.
- Prediction tickets were accepted when scoped to concrete items such as `die:*`, `cell:*`, `ship:*`, and `track:*`.
- The energy-room prediction was confirmed in public state: energy increased from 2 to 6 after resolving `A-upper-energy` with `pay:true`.

## Blocker

After resolving `A-upper-research`, the public state exposed:

- `pending.type`: `room_effect`
- `pending.effectKind`: `research_room_choice`
- `pending.roomId`: `A-upper-research`
- `pending.budget`: 1
- `pending.maxAdvanceSteps`: 0
- `availableOperations`: `choose_research_advance`

The player selected zero research advance, but every natural payload form was rejected by the formal layer as an undefined choice:

- `{"type":"choose_research_advance","steps":0}`
- `{"type":"choose_research_advance","advanceSteps":0}`
- `{"type":"choose_research_advance","advance":0}`
- `{"type":"choose_research_advance","value":0}`
- `{"type":"choose_research_advance","choice":0}`

Because the protocol forbids reading source, checkpoint, or hidden audit data while choosing, the attempt stopped here.

## Validation

- `node verify-public-evidence.js stage1`: failed with `invalid three-round stop`.
- `node verify-public-evidence.js final`: failed with `final evidence is not at a formal outcome`.
- `node ../ufs_first_action_imagination_v0/audit-three-round-gate.js . 3`: failed with `stageGatePassed: false`.

## Conclusion

V18 is a useful failed run. It shows the isolated player-profile path starts correctly, but the public research-choice contract is not currently playable by an isolated strategy agent. The next system fix should make the public `choose_research_advance` payload explicit and accepted, especially for `maxAdvanceSteps: 0`, then rerun a fresh V19 attempt.

