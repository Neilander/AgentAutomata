# Agent Handoff: UFS Compact Attention Player View

- Date: 2026-08-25 16:58 Asia/Shanghai
- Agent/thread: root / simulatePlayer worktree
- Scope: reduce token use in attention-limited CLI playtests without changing attention or hiding audit evidence
- Status: complete

## User Intent

Keep the full 153+ item probabilistic attention system, but stop sending repeated internal attention evidence to the player Agent on every step. Preserve complete evidence for host-side review, and use a cheaper subagent model when the current subagent interface supports one.

## Completed

- Added a compact response projection shared by the one-round and full-game CLIs.
- Player-facing stdout, `current-player-view.json`, and `machine-transcript.jsonl` still expose every decision fact in `observation`, `mapView`, `pending`, and `availableOperations`, plus the attention budget summary and seed.
- Removed only duplicated/internal fields from the player-facing view: `noticedItems`, `attention.traceBefore`, `attention.traceAfter`, and `attention.carryoverAppliedItemIds`.
- Added private `attention-audit-transcript.jsonl` persistence containing the complete pre-compaction attention response for every step.
- Documented that sealed player Agents must not read the private audit transcript.
- Added unit and CLI contract coverage for both one-round and full-game paths.
- Confirmed the current subagent model override interface does not expose `gpt-5.3-codex-spark`; the available economical fallback is `gpt-5.6-luna` with low reasoning. This is a current tool-interface limit, not a claim that Codex-Spark does not exist.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/compact-attention-response.js`: shared compact player-view projection.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/attention-player-cli.js`: compact stdout/public transcript plus private full attention audit.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/full-game-attention-player-cli.js`: same two-layer output for cross-round play.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-attention-player-session.js`: compact-view and one-round CLI audit tests.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-full-game-attention-session.js`: full-game CLI compact/audit test.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: two-layer output and sealed-agent protocol.

## Validation

- Focused compact/audit tests: 13 passed, 0 failed.
- Full UFS cognitive/session regression plus imagination pipeline: 86 passed, 0 failed.
- Full-game initial response measurement at attention seed `2026082507`: 19,843 bytes full audit response → 6,042 bytes compact player response, a 69.6% reduction.
- Compact and full views retain identical `observation`, `mapView`, `pending`, and `availableOperations` in contract tests.
- Worktree branch is `simulatePlayer`; commit `53367a4` remains an ancestor of HEAD.

## Current State

The player still receives the same attention-limited world and therefore makes decisions from the same noticed facts. It no longer pays context cost for a second list of those same facts or for the host's short-term trace bookkeeping. Host-side evidence remains complete and append-only in the opaque state directory.

## Unresolved

- `gpt-5.3-codex-spark` cannot currently be selected through this session's subagent model override list. Do not silently claim it was used.
- Output savings were measured on the initial full-game response; later steps vary with visible placements, ships, and pending choices.
- Existing V7 evidence remains sealed and unchanged; a new full-game result still requires a new Agent and unique attempt.

## Recommended Next Step

Run the next sealed full-game attempt with `gpt-5.6-luna` and low reasoning through the compact full-game CLI. If `gpt-5.3-codex-spark` later appears in the subagent model override list, switch the same bounded player task to it without changing the CLI contract.
