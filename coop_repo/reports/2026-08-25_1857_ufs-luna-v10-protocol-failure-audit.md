# Agent Handoff: UFS Luna V10 Protocol-Failure Audit

- Date: 2026-08-25 18:57 Asia/Shanghai
- Agent/thread: root / simulatePlayer
- Scope: fresh low-cost subagent playtest after information-gap recovery
- Status: complete audit; playtest is not a completed full game

## User Intent

Run another subagent playtest using an explicitly cheaper model, preserve its reasoning and public evidence, then have root read and assess the report.

## Completed

- Created a fresh V10 sealed recorder at seed `2026082510`.
- Ran the player as `gpt-5.6-luna` with `low` reasoning.
- Required every operation to record alternatives, expected outcome, and selection reason before the CLI call.
- Preserved 33 ordered decision records, stdout/stderr, payloads, machine ledger, and the private host/audit state.
- Audited the public ledger and deterministically replayed all successful/rejected operations through the current session implementation with zero status/reason mismatches.
- Inspected the private cognitive trace only after the attempt stopped.

## Player Result

This is a protocol-failure sample, not a completed full-game result.

- The player first stopped at sequence 021 during a normal round-2 `choice/place_die` boundary.
- Root resumed the same state at 022; it stopped again at sequence 027 after entering round 3 at another normal `choice/place_die` boundary.
- Root resumed at 028; it stopped again at sequence 030 at a normal choice.
- Root resumed at 031; it stopped at sequence 033 immediately after a rejected occupied-column placement, although `availableOperations=[place_die]` remained.
- No rules win/loss and no `attention_stop` occurred.
- The attempt completed two rounds and reached round 3 before the final protocol failure.
- In total it stopped prematurely four times: 021, 027, 030, and 033. The Agent's first reports remained stale at sequence 021 through several resumptions; after a final report-only instruction it appended the true sequence-033 boundary and explicitly marked the attempt incomplete.

## Strategy Assessment

- The player did make locally intelligible comparisons, e.g. preferring visible research, high die values in fighter rooms, and free AA/tunnel placements.
- It did not maintain a reliable long-term placement ledger. It repeatedly selected already occupied columns despite prior actions being present in its own decision file.
- It used `end_rooms` as a safe fallback when remembered room patches were not actionable, sacrificing room value rather than maintaining a coherent resource plan.
- It generated one malformed process-level action at sequence 002, seven public rejected actions, and repeatedly needed rejection text to repair payload shape.
- Therefore `gpt-5.6-luna + low` is adequate for short local choices but currently unreliable as an unaided long-horizon protocol executor/player.

## Information-Gap Recovery Finding

The new recovery mechanism was exercised and did prevent the old hard-stop pattern:

- One missing endpoint, `tile:C1:5.kind`, was recovered by `knowledge_directed_lookup` as `normal`.
- One unavailable endpoint, `tile:C3:17.kind`, exhausted knowledge lookup and targeted exploration, producing `unknown_information_v0` confusion.
- The controller continued after both cases; the ledger contains zero `attention_stop` responses.

The audit also found a propagation gap: the `tile:C3:17.kind` confusion exists in the generic sky pipeline trace, but subsequent public responses still expose `observation.uncertainties=[]`. `applyPlacementToImaginedState` does not currently carry generic sky-pipeline uncertainties into the UFS imagined player state. Thus the mechanism continued correctly but the strategy player was not told about this confusion.

The row-17 endpoint also deserves separate rule review: a ship moved beyond the represented city row and was treated as an unknown endpoint instead of an explicit city-contact/overshoot consequence.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_attention_full_game_playtest_v10/`: sealed recorder, protocol, 33-step evidence, decisions, results, and round summaries.
- `coop_repo/reports/2026-08-25_ufs-attention-full-game-playtest-v10.md`: subagent-authored report, ultimately corrected to mark the nonterminal stop.
- `coop_repo/reports/2026-08-25_1857_ufs-luna-v10-protocol-failure-audit.md`: root audit.

## Validation

- Ledger: 33 sequential records, one start, 33 pre-operation decision entries.
- Public outcomes: 19 choice, 6 random, 7 rejected, 0 complete, 0 attention_stop; plus one process-level malformed action failure.
- Final response: sequence 033, `rejected / invalid_action:selected column is already occupied: C2`, `availableOperations=[place_die]`, round 3.
- Deterministic replay of all recorded state-changing and rejected actions: zero status/reason mismatches.
- Cognitive trace audit: one unique successful targeted lookup and one unique unresolved confusion (repeated in cumulative traces).

## Current State

The information-gap recovery change passed a live multi-round stress sample in the narrow sense that missing information no longer stopped the game. The playtest itself failed for a different reason: the weak model repeatedly abandoned a nonterminal task and forgot prior column occupancy.

## Unresolved

- Propagate `skyResult.imaginedWorld.uncertainties` into the UFS imagined state/player observation.
- Define city contact when descent passes rather than exactly lands on the city row.
- Decide whether the operation response should expose legal placement candidates, or whether remembering occupied columns remains deliberately the player's responsibility.
- A future full-game result should either use a more reliable model or an external continuation supervisor; V10 must not be reported as a win/loss sample.

## Recommended Next Step

First fix the generic sky-confusion propagation and city-row overshoot semantics. Then run a short, bounded `gpt-5.6-luna + low` test per round rather than asking it to own one long evidence protocol; use the same player state across supervised continuations so strategy quality and protocol endurance are evaluated separately.
