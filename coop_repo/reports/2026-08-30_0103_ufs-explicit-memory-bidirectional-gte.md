# Agent Handoff: UFS explicit transition memory and bidirectional GTE provenance

- Date: 2026-08-30
- Agent/thread: root / codex/simulate-player-next
- Scope: explicit experience records, many-memory trajectory support, forward prediction provenance, paired Q-before/Q-after source tracing, and ordered operation sequences
- Status: complete for new audited personal feedback

## User Intent

Keep the existing Q-before→Q-after and fuzzy GTE activation model, but stop treating the vector row as the only memory. Every audited experience must remain exactly recallable, multiple concrete memories may support one cognitive trajectory, Q-before plus an operation sequence must predict Q-after with its sources, and Q-before plus Q-after must trace back to the supporting memory IDs. One and many operations must use the same representation without confusing order.

## Completed

- Added `ufs_explicit_transition_memory_v1` as the factual personal-memory record. It stores a unique `memoryId`, Q-before, an exact ordered `operations[]`, Q-after, applicability, audited evidence, source, episode/ticket context, linked trajectory IDs and creation time.
- Added a separate monotonic memory-ID counter so introducing memories does not renumber existing trajectory IDs or break historical expectations.
- Changed personal trajectories to retain `activationQ`, the explicit operation sequence/key, whether the sequence was explicitly observed, and `supportingMemoryIds[]`.
- Repeated audited experiences now create separate memories while converging on one trajectory. Duplicate submission of the same evidence ID is idempotent; conflicting reuse of an evidence ID is rejected.
- Confirmations of frozen/precompiled rule trajectories still avoid duplicating the rule edge, but their connection overlay now keeps supporting memory IDs and exact pair tracing can recover those experiences.
- New GTE current rows compile the joint `Q-before + ordered operations` query; the raw Q-before, operations and Q-after remain separately recoverable from explicit memory.
- Added forward GTE retrieval returning Q-after, trajectory ID and all supporting memory IDs/memories.
- Added paired current/following GTE retrieval. It requires both sides to activate (`min(currentActivation, followingActivation)`) and returns the trajectory plus all supporting memories.
- Added exact learner-side `traceTransition`, `recallExperiences` and `recallMemory` paths, including memories that support frozen rule trajectories rather than a duplicated personal row.
- Added session read-only APIs:
  - `predictLearnedTransition(Q-before, operations)`;
  - `traceLearnedTransition(Q-before, Q-after, options)`;
  - `recallExplicitMemory(memoryId)`.
- Threaded exact single- or multi-operation sequences through deliberate prediction tickets, automatic tickets, recalled feedback tickets and the feedback bridge. A completed two- or three-operation cognitive unit is written as one memory containing the complete sequence.
- Persisted memories and their source mappings through live checkpoint, restore, player capture, continue and fork. Fresh players still have zero personal memories.
- Kept the frozen initial-player template byte/fingerprint compatible by creating the empty memory collection lazily when a learner session starts.
- Documented the architecture and compatibility boundary in the experiment README.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-transition-memory.js`: ordered-operation normalization, stable sequence identity and joint Q-before+behavior activation Q.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-feedback-learning.js`: explicit-memory lifecycle, many-memory trajectory links, exact forward experience recall and paired source tracing.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/player-feedback-gte.js`: joint-current compilation, memory-aware forward results, and paired current/following matrix retrieval.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-prediction-ticket.js`: exact operation sequences on deliberate and automatic tickets.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-feedback-bridge.js`: operation/episode/ticket provenance passed into every new explicit experience.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-attention-session.js`: memory-aware matrix refresh, checkpoint restore and public read-only prediction/trace/recall APIs.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-prechoice-planner.js`: joint Q-before+ordered-behavior vectors for new personal-feedback candidate queries.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-player-generator.js`: lazy fresh initialization compatibility, memory persistence/counting and episode/fork summaries.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-ufs-feedback-learning.js`: many-memory convergence, pair tracing, evidence idempotence, precompiled-rule provenance and order isolation.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-player-generator.js`: real runtime APIs, checkpoint/capture/fresh isolation, forward/pair GTE retrieval and reversed-order rejection.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-prechoice-planner.js`: complete two- and three-operation memories and source tracing.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: explicit-memory and bidirectional-index contract.

## Validation

- Full UFS suite: 15 test files, 152/152 passed.
- Data closure: two audited attempts produced two `memoryId`s and one shared trajectory whose `supportingMemoryIds` contained both.
- Evidence idempotence: submitting the same evidence twice left one memory and one support link.
- Ordered sequence isolation: `[insert_key, turn_key]` and `[turn_key, insert_key]` remained separate; the reversed sequence returned no forward or paired GTE match.
- Real two-operation research unit persisted both operations in one explicit memory and traced its Q pair back to that memory.
- Real three-operation energy-room unit persisted both placements plus room resolution in one explicit memory.
- Checkpoint restore and player capture retained the exact memory and its pair lookup; unrelated fresh players remained at zero memories.
- Real local `gte-multilingual-base` smoke test compiled one two-operation transition. Forward query and paired query both returned `memory-00001`; paired current activation was `1.0000000758` and following activation `1.0000000141`.
- `git diff --check`: passed; only existing Windows LF→CRLF warnings were emitted.

## Current State

For every newly audited personal feedback event, the factual experience is now independently recoverable and no longer collapses into an opaque matrix row. GTE remains the fuzzy semantic index. Its returned trajectory points to all concrete memories that support the prediction, and a Q-before/Q-after pair can be traced back to the same source set. A behavior is uniformly represented as an ordered array of length one or more.

This work does not change how a temporal cognitive unit is discovered. The existing bounded UFS room/research expander remains a mechanism test and is still hard-coded. The new memory layer merely records and retrieves whatever audited single- or multi-operation experience actually reaches it.

## Unresolved

- Historical player trajectories were not retroactively converted into explicit memories because their exact operation sequences and episode boundaries were not always preserved. Their old provenance remains available, but `supportingMemoryIds` may be empty until new audited experience occurs.
- `queryPairVectors` supports arbitrary separately compiled current/following query vectors, but the session convenience API currently performs exact-row pair lookup. Online batch compilation for wholly new Q-before/Q-after wording is a later optimization/API extension.
- Frozen rule GTE rows and personal feedback GTE rows remain separate stores. A new experience confirming a frozen rule is exactly traceable through learner memory/connection provenance, but the frozen matrix itself does not yet expose the personal memory IDs as row metadata.
- The operation sequence is exact and order-sensitive. Learning that two sequences are equivalent, unordered or partially ordered belongs to later causal/experience induction.
- Automatic discovery of temporal unit boundaries, behavior-rule-result inference, contextual value and multi-step planning are deliberately outside this unit of work.

## Recommended Next Step

Design the behavior–rule–result missing-vertex layer on top of this source-traceable memory substrate. Begin with read-only hypothesis generation from explicit memories; do not change the planner or create new hard-coded UFS temporal objectives until rule inference and evidence handling are agreed.
