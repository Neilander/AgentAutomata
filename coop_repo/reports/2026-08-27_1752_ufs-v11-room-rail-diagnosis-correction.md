# Agent Handoff: V11 room and mothership-rail diagnosis correction

- Date: 2026-08-27 17:52 Asia/Shanghai
- Agent/thread: root
- Scope: correct the V11 diagnosis and improve the public cognitive/player contract
- Status: complete

## User Intent

Fix the room-resolution and research-progression problems reported after the first complete strong-model playtest.

## Completed

- Reproduced the V11 room attempts and inspected their actual room occupancy.
- Corrected the earlier diagnosis: `A-upper-energy` was a two-cell room with only one cell occupied, so rejection was required by the rules; AA and ordinary tunnel rooms intentionally have no room-phase output.
- Corrected the research diagnosis: the round-3 mothership reached printed rail row 6, whose `research_back:1` action correctly moved research from 1 to 0. There was no cross-round state loss.
- Added room-action candidate cards to the public operation boundary: resolvable, incomplete, no-output, unremembered, excavation, and skippable targets are now distinguished.
- Replaced misleading room errors with stable `room_incomplete`, `room_has_no_room_phase_effect`, and `room_state_not_remembered` reasons.
- Added all eight printed mothership rail actions to the probabilistic attention field and to `mapView.mothershipActions` when noticed.
- Made the current rail action a feedback focus at a round/terminal boundary, so its noticed result can stick into the next player observation without making attention exhaustive.
- Expanded the initial attention space from 153 to 161 items while retaining the 41-item budget.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-one-round-imagination.js`: room candidate cards and accurate atomic rejection reasons.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-attention-provider.js`: mothership rail items, event grounding, feedback focus, and player map projection.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-one-round-session.js`: room candidate and rejection regressions.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-one-round-imagination.js`: research-back versus preservation regression.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-attention-integration.js`: 161-item field and rail-attention regressions.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-attention-player-session.js`: public projection and attention-count regressions.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: corrected semantics and updated contracts.

## Validation

- Ten related Node suites, including the cognitive program library and generic imagination pipeline: 106/106 passed.
- Replayed all 73 public V11 actions through the corrected runtime without altering the sealed V11 evidence: still reaches the same legal round-7 loss.
- V11 critical replay step 021 now reports `A-upper-research` as resolvable, `A-upper-energy` as incomplete, and the occupied AA rooms as no-output.
- V11 critical replay step 022 atomically rejects the old attempt as `invalid_action:room_incomplete:A-upper-energy`.
- V11 critical replay step 036 reports research 0, mothership row 6, and exposes `{type: research_back, amount: 1}` in the noticed rail view for the same seed.
- `node --check` passed for both changed core modules.
- `git diff --check` passed apart from repository line-ending warnings.

## Current State

The system no longer describes correct rule behavior as a missing program or lost state. Players receive a concise legal-target classification at room choices, while the cause of mothership track changes can enter the same limited attention field as other printed board elements. The old V11 attempt remains valid immutable evidence of a legal loss, but its reports' room/program and research-reset diagnoses are superseded by this correction.

## Unresolved

- No new strategic playtest has yet used the room candidate cards and rail-action view. Their effect on decision quality is unmeasured.
- The player can still probabilistically miss rail actions; this is intentional. The current-row action receives strong feedback focus but is not globally forced into awareness.
- A player may still deliberately submit an ID from an incomplete/no-output list; the rejection remains atomic and explicit.

## Recommended Next Step

Run a fresh sealed strong-model playtest with a unique seed. Audit whether it uses `pending.candidates` to fill both cells of multi-cell rooms, avoids resolving AA/tunnel rooms, and correctly explains mothership rail consequences while pursuing energy → excavation → research.
