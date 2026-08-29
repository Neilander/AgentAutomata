# Agent Handoff: UFS Information-Gap Recovery

- Date: 2026-08-25 17:57 Asia/Shanghai
- Agent/thread: root / simulatePlayer
- Scope: missing-information query, targeted exploration, confusion propagation
- Status: complete

## User Intent

When the cognitive player discovers that an imagined consequence lacks a needed fact, it should first query learned knowledge, then perform one goal-directed state search if knowledge cannot locate the fact, preserve confusion if both fail, and continue to a decision instead of terminating.

## Completed

- Added a generic `InformationGapResolver` with four auditable outcomes: knowledge answer, knowledge-directed narrow lookup, one bounded goal-directed state exploration, and serializable `unknown_information_v0` confusion.
- Wired recovery into selected-room placement Q formation and JSON grounding, generic five-slot sky grounding and endpoint Q formation, and the 20-event event-Q path.
- Query-acquired facts are recorded separately from the original probabilistic attention sample; the original 153-item space and 41-item attention budget are not rewritten after the fact.
- If a requested fact remains unavailable, the dependent automatic effect is left unknown, the uncertainty is retained in the imagined state, and the first-action flow returns a player `choice` rather than `attention_stop`.
- Replayed the exact V9 seed/action that previously stopped on an omitted `mothership.row`. It now performs one knowledge-directed lookup, moves the mothership from -1 to 0, and returns `choice / waiting_for_die_placement` with `place_die` still available.
- Preserved the sealed V9 evidence unchanged; the new replay is a regression test, not a rewrite of the historical attempt.
- Kept all changes inside the simulation/research worktree. The main equipment-grind path was not touched.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/information-gap-resolver.js`: generic knowledge/query/exploration/confusion resolver.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/placement-rule-imagination.js`: recover missing selected-room/Q/grounding slots.
- `projects/western_fantasy_continent/experiments/imagination_pipeline_v0/imagination-pipeline.js`: recover grounding and endpoint slots, or propagate explicit uncertainty.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-event-rule-imagination.js`: replace incomplete-event hard stops with recovery or uncertain automatic patches.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-first-action-imagination.js`: recognize queried landing tiles and carry unresolved confusion to the next choice.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-attention-provider.js`: expose self-known uncertainties without adding them to the 153-item random attention draw.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-information-gap-resolver.js`: village-chief and resolver branch tests.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-event-rule-imagination.js`: query-success and inaccessible-fact continuation tests.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-first-action-imagination.js`: room lookup, endpoint lookup, and confusion-to-next-choice tests.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-attention-session.js`: exact seed `2026082509` V9 regression.
- `projects/western_fantasy_continent/experiments/imagination_pipeline_v0/test-imagination-pipeline.js`: generic grounding lookup and unresolved endpoint tests.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: updated missing-information behavior.

## Validation

- All 10 Node test files across `ufs_first_action_imagination_v0` and `imagination_pipeline_v0`: **97/97 PASS**.
- Exact V9 regression: **PASS**; response is `choice`, mothership row is 0, and the trace records `mothership.row` from `knowledge_directed_lookup` without exploration.
- Generic resolver branches: **4/4 PASS**.
- Unfindable selected-room end-to-end case: **PASS**; uncertainty persists and the selected die is recorded before returning the next decision.
- `node --check placement-rule-imagination.js`: PASS.
- `git diff --check`: no whitespace errors; only existing LF/CRLF conversion warnings.

## Current State

The recovery order is now:

```text
named missing slot
→ one knowledge query
→ direct answer or knowledge-directed single-slot lookup
→ otherwise one bounded goal-directed exploration
→ otherwise unknown_information + confusion
→ skip only the dependent unknown effect
→ continue to the next player decision
```

This does not make the player omniscient. Background facts can still be omitted by probabilistic attention, and the system only queries a fact after a trajectory/Q/program identifies a specific missing slot. Query results are auditable and do not retroactively count as part of the initial attention sample.

## Unresolved

- `PUBLIC_SLOT_LOCATOR_KNOWLEDGE` currently represents a broad learned ability to locate any named public state slot. Future games should replace or restrict it with game/player-specific locator knowledge where knowing how to find the fact is itself uncertain.
- Goal-directed exploration is deliberately small and lexical; it is sufficient for the current structured state items but not yet a navigation planner for large spatial worlds.
- Confusion propagation now reaches the next choice, but the strategy scorer does not yet price uncertainty explicitly when comparing candidates.
- Feedback learning remains separate and is not implemented by this change.

## Recommended Next Step

Run a new isolated lightweight-agent full-game attempt from a fresh seed. The key evaluation is no longer whether the old V9 hard stop disappears—it is covered by regression—but whether repeated targeted queries and retained confusions produce believable decisions over multiple rounds without drifting toward full-state omniscience.
