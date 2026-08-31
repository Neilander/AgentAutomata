# Agent Handoff: UFS V22 learned player five terminal games

- Date: 2026-08-29 14:47 Asia/Shanghai
- Agent/thread: `/root/ufs_v22_five_games`
- Scope: start from exact V20 revision 1, play and capture five consecutive full games, audit Game 1 vs Game 5
- Status: complete

## User Intent

Use the already learned UFS player for five complete games—not five rounds.  After each formal
terminal result, capture that episode exactly once into a new revision and start the next game from
that output.  Freeze comparable attention/randomness, preregister process/outcome metrics, and
answer whether Game 5 improves over Game 1 while distinguishing saved, activated, and effective
learning.

## Completed

- Created isolated experiment
  `projects/western_fantasy_continent/experiments/ufs_learned_player_five_games_v22/` with protocol,
  replayable tape, public-only recorder/controller, per-game verifier, one-time capture wrapper,
  five-chain auditor, results, and detailed agent report.
- Preserved the exact source profile
  `ufs_revision1_vs_fresh_control_v21/profiles/treatment-v20-revision1.json`; SHA-256 remains
  `a1c3a2f13257cd89eea08581137ad1fedbd0b81addda0eff5a0ee4a4e9b8d92c`.
- Played five new isolated episodes from formal initial state to formal terminal loss.  No ordinary
  choice/random boundary stopped a game; no retry, seed selection, or better-result rerun occurred.
- After each terminal, ran a pre-capture audit, captured once into a new profile, ran a post-capture
  audit, and copied that exact output as the next immutable input.  Revision chain is
  `1→2→3→4→5→6`; episode chain is `0002→0003→0004→0005→0006`.
- Frozen attention seed is `2026082920`; frozen random-tape seed is `2026082922`, SHA-256
  `87af864441a322a5f766151e66feb60a4845b8d2a26905e6abad3bdc709d81d5`.  Each game consumed the
  same seven white-reroll and six next-round-roll observations; Game 1 vs Game 5 random divergence
  is zero.
- Each game has 105 public evidence records: one start, 91 deliberate actions, 13 random
  observations.  All 91 deliberate actions have an explicit pre-action prediction; all 104
  operations were accepted; rejected/invalid count is zero.
- Audited the five requested hazard classes and feedback activation.  Each game kept energy at or
  above 1, correctly completed seven temporary two-cell-energy partial states before room
  resolution, had one actual research rollback, two late mothership-danger room endings, and no
  invalid choice.
- Wrote `AUDIT_SUMMARY.json`, `RESULTS.md`, and `AGENT_REPORT.md` with the full trend and bounded
  interpretation.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_learned_player_five_games_v22/`: complete V22
  experiment, five state/evidence/profile chains, reusable auditors, results, and report.
- `coop_repo/reports/2026-08-29_1447_ufs-v22-learned-player-five-terminal-games.md`: this handoff.
- `coop_repo/LATEST.md`: appended the V22 result entry without replacing prior V21 entries.

No UFS formal engine, feedback-learning algorithm, player generator, or shared V20/V21 artifact was
changed by this experiment.

## Validation

- `node .../ufs_learned_player_five_games_v22/audit-five-games.js`: passed.
  - five terminal games;
  - input revisions `[1,2,3,4,5]`, output revisions `[2,3,4,5,6]`;
  - capture receipts `[1,1,1,1,1]`;
  - five distinct state directories;
  - 91/91 deliberate predictions per game;
  - zero nonzero exits, rejected operations, invalid operations, pending tickets, or random
    contract mismatches;
  - Game 1 vs Game 5: 0 normalized public-view divergences, 0 behavior-payload divergences, 0
    random-payload divergences.
- Full UFS test suite across all 14 `test-*.js` files: 137/137 passed.
- `git diff --check`: passed; only pre-existing LF→CRLF warnings for already modified shared files.

## Current State

All five games are formally complete and all five states are sealed by a single capture receipt.
Every game ended identically:

- result: loss, `mothership_reached_skull_row`;
- terminal round 7;
- damage 5, energy 3, research 7, excavator 0, mothership row 11;
- 104 operations / 105 records;
- prediction dispositions: 76 confirmed, 34 contradicted, 37 unresolved, 7 ambiguous;
- zero `feedback-*` trajectory activations.

Learning storage advanced correctly.  Game 1 added 81 trajectories and 2 connections; Game 2
added 11 trajectories; Games 3-5 added none.  Each game appended 154 prediction-ledger entries.
The final revision-6 profile has 146 trajectories, 11 connections, 0 attention adjustments, and
959 ledger entries.  All 146 feedback trajectories remain `pending_matrix_compile`.

The required conclusion is: **Game 5 did not improve over Game 1.**  Learning was saved, but no
stored `feedback-*` trajectory entered the actual prediction/decision path, and behavior/outcome
did not change.

## Unresolved

- This is one controlled keyed tape, not a multi-seed statistical estimate; it cannot establish a
  population-level learning effect.
- Game 1's first 14 operations were driven live while the reusable driver was instantiated.  The
  formal/behavior audit found them behaviorally identical to Game 5; 13 optional prediction
  rationale strings differ.  Games 2-5 are identical even in full prediction payloads.
- Zero activation is consistent with every feedback trajectory remaining `pending_matrix_compile`,
  but this experiment does not prove compilation is the only missing path.
- The controller avoided zero energy and partial-room mistakes but never advanced the excavator
  and still failed the mothership deadline.  That is a strategy limitation, not a system blocker.

## Recommended Next Step

Do not infer improvement from further captures of the same unactivated path.  First connect or
compile stored `feedback-*` trajectories into the actual GTE/prediction activation route, then run
this same frozen protocol over multiple preregistered tapes.  Preserve the present V22 chain as the
null baseline.

