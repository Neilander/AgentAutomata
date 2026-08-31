# Agent Handoff: UFS temporal cognitive units

- Date: 2026-08-29
- Agent/thread: root / codex/simulate-player-next
- Scope: allow one currentQ→followingQ cognition to span two to four dependent operations
- Status: complete for the bounded room-investment vertical slice

## User Intent

Stop treating every formal API operation as a complete cognitive unit. A player must be able to
represent and carry a two- or three-step investment, such as placing two dice into one room, until
the combined effect becomes visible. Solve this temporal representation before replacing the
fixed candidate-value heuristic.

## Completed

- Added `ufs_temporal_cognitive_unit_v1`, with an explicit causal objective, ordered operations,
  operation cursor, completion reason and final imagined world.
- Changed planning from one callback per operation to bounded sequence simulation. Room-centered
  branches may now span up to four operations; public randomness remains a hard suspension boundary.
- Added causal continuation for two important real structures:
  - multiple placements into the same multi-cell room, continuing to room resolution when the
    room phase is reached;
  - research-room payment followed by every legal research-advance choice.
- Persisted an active cognitive unit in the full-game checkpoint. While its next operation is legal,
  `planCurrentChoice()` returns that continuation instead of silently replanning from scratch.
- Added cognitive-unit metadata to the public operation contract and stripped it before the
  authoritative formal operation, so it cannot alter game legality.
- Added a separate pending cognitive-unit prediction queue. Unit predictions survive ordinary
  stable operation boundaries and are evaluated only after the complete unit reaches its causal
  result boundary. Capture refuses to discard those pending predictions.
- Documented the new temporal boundary in the main experiment README.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-temporal-cognitive-unit.js`:
  causal objective inference, bounded sequence expansion, random suspension and completion boundaries.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-prechoice-planner.js`:
  compare complete temporal branches and emit a submit-able first operation carrying the unit.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-attention-session.js`:
  sequence simulation, active-unit cursor, checkpoint restore and continuation planning.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-feedback-bridge.js`:
  defer compound-Q tickets across intermediate stable boundaries until unit completion.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-prediction-ticket.js`:
  validate and strip cognitive-unit metadata from formal operations.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-player-generator.js`:
  reject capture while compound prediction tickets remain pending.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-prechoice-planner.js`:
  real two- and three-operation planning/execution/learning regressions.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-attention-session.js`:
  updated self-describing public contract regression.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`:
  temporal cognitive-unit contract and current supported boundaries.

## Validation

- Real two-operation research unit: `resolve_room(A-upper-research) → choose_research_advance(2)`
  imagines and formally observes energy `2→0` plus research `0→2` in one followingQ.
- Real three-operation investment unit:
  `place A-r2-c4 → place A-r2-c5 → resolve A-upper-energy` imagines and formally observes energy
  `2→4` in one followingQ.
- In both cases the active cursor survives intermediate choices, `planCurrentChoice()` returns the
  exact continuation, the unit ticket stays pending between operations, and one confirmed
  `issuedForOperation: cognitive_unit` ledger entry appears only after completion.
- Initial real choice surface contains 24 two-operation room-investment branches; branches that hit
  a white-die reroll are marked suspended instead of inventing random values.
- Full UFS suite: 15 test files, 147/147 passed.
- `git diff --check`: passed with only existing LF-to-CRLF warnings.

## Current State

The representational bug is closed for the bounded room-investment slice: currentQ and followingQ
no longer have to be separated by exactly one formal operation. The same cognitive unit can retain
two investments, continue through the resulting choice, and learn from the final combined result.

This does not claim that the player now chooses the strategically best temporal branch. The current
planner still orders final branch states with the previously disclosed fixed scalar weights. The
change makes the correct delayed consequence available to the later value mechanism; it does not
solve contextual value by itself.

## Unresolved

- Context-activated value remains unimplemented; fixed energy/research/damage weights still choose
  among the now-richer temporal branches.
- Temporal expansion currently recognizes room investment and research continuation, not arbitrary
  learned causal objectives.
- If unrelated dice must be placed after a target multi-cell room becomes ready, the unit stops at
  the `room_investment_ready` milestone rather than branching across every filler placement.
- A public random boundary suspends the unit safely, but automatic resume/replanning after the
  supplied random observation is not yet implemented.
- Terminal credit assignment, structural generalization and uncertainty-guided exploration remain
  separate later problems.

## Recommended Next Step

Replace the fixed scalar candidate weights with context-activated value relations over the final
state of each temporal cognitive unit. Keep the new temporal unit and its predictions unchanged, so
the next experiment isolates value selection rather than mixing it with horizon repair.
