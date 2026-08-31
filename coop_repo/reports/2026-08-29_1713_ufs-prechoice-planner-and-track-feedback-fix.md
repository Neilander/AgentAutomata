# Agent Handoff: UFS pre-choice planning and scalar feedback repair

- Date: 2026-08-29
- Agent/thread: root / codex/simulate-player-next
- Scope: one-choice candidate imagination, personal GTE influence on selection, scalar track audit repair
- Status: complete

## User Intent

Replace the historical fixed action policy with a first real planning step: imagine each legal
behavior before choosing, make already compiled personal feedback affect that comparison, preserve
fresh-player initialization, and keep later macro/terminal planning separate.

## Completed

- Added a read-only pre-choice planner that enumerates public contract candidates, forks the
  player's cognitive checkpoint for each, runs the existing rule/GTE/program imagination to the
  next boundary, and compares explicit track/terminal consequences.
- Added batched real-GTE query-vector compilation for completely novel candidate Q wording and a
  vector-query API for the private feedback matrix.
- Reconstructed recalled consequences only from player-visible, formally audited prediction ledger
  evidence. A matching feedback trajectory can now replace the baseline imagined outcome by its
  activation-weighted learned outcome before selection.
- Added `full-game-attention-player-cli.js plan <state-dir>`. It returns a submit-able recommended
  payload and prediction ticket without changing the host, transcript or checkpoint.
- Switched the active `autoplay-game.js run()` choice path from the fixed `choose()` controller to
  the new planner. The old chooser remains exported only for historical reproduction.
- Fixed scalar prediction targets such as `track:energy` when legacy payloads also include redundant
  `field: energy`. They now audit the numeric scalar instead of `undefined`.
- Preserved the player generator and fresh-profile contract. Fresh players still have no private
  trajectories, matrices or ledger.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-prechoice-planner.js`: candidate enumeration, isolated simulation, scoring and GTE adjustment.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/player-feedback-gte.js`: batched query encoding and arbitrary query-vector Top-K.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-attention-session.js`: read-only `planCurrentChoice()` and cognitive forks.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/full-game-attention-player-cli.js`: `plan` command.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-prediction-ticket.js`: scalar-track compatibility fix and planner Q export.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-full-game-feedback-bridge.js`: audited expectation export for planner reuse.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-prechoice-planner.js`: causal choice, isolation, scalar and CLI regressions.
- `projects/western_fantasy_continent/experiments/ufs_learned_player_five_games_v22/autoplay-game.js`: active planning path.
- `projects/western_fantasy_continent/experiments/ufs_prechoice_planner_v23/`: reproducible real-profile comparison and results.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/README.md`: current behavior and limitations.

## Validation

- UFS full suite: 15 test files, 144/144 passed.
- New planner suite: 4/4 passed, including checkpoint non-mutation and learned-vs-fresh action divergence.
- Real revision-7 comparison: same seed; initial boundary recalled feedback on 5 candidates, first
  room boundary recalled feedback with top activation `0.92179`; neither old-profile action changed
  because historic consequences were non-valued/`undefined`.
- V22 historical five-game read-only audit: `passed: true`; all existing evidence remains intact.
- `git diff --check`: passed with only existing LF-to-CRLF warnings.

## Current State

The live choice flow is now:

1. Read the public choice contract.
2. Enumerate candidate payloads.
3. Clone the player's cognitive checkpoint per candidate.
4. Imagine each candidate to the next short boundary using the existing frozen rule system.
5. Batch-encode candidate Qs with the real local GTE.
6. Retrieve context-compatible private feedback.
7. Convert only audited actual consequences into comparable utility.
8. Rank, return one payload with an explicit prediction ticket, then submit separately.

A controlled compiled-feedback test proves that step 6/7 changes step 8. The real revision-7 player
retrieves old feedback but does not change the two tested actions because those historical records
do not contain usable differing value consequences.

## Unresolved

- Revision 7 contains historical scalar audit results already persisted as `undefined`; this change
  prevents future corruption but does not invent a migration. A trustworthy repair would require
  replaying/reconstructing those values from preserved formal evidence.
- The horizon stops at the next choice/random/stable boundary. Early die placements often have
  identical immediate track utility, so room-completion and multi-action consequences are not yet
  compared.
- Only track and terminal expectations currently modify utility. Entity-only facts such as
  `die.placed=true` are retrieved and reported but intentionally do not imply strategic value.
- Real learned planning starts the offline GTE encoder once per decision (about 9-12 seconds in the
  bounded real-profile checks). A resident encoder or query cache is needed before long runs.
- Round-level and terminal-loss credit assignment remain separate, as requested.

## Recommended Next Step

Add multi-step/beam imagination across dependent placement and room-resolution choices, while
keeping the current audited personal-feedback adjustment at each branch. Separately decide whether
to reconstruct the old revision-7 scalar ledger from preserved formal transcripts or begin a clean
new learned revision whose future feedback values are correct.
