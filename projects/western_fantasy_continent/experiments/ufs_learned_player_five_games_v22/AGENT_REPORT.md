# V22 agent report: learned player, five complete consecutive games

- Date: 2026-08-29 Asia/Shanghai
- Branch: `codex/simulate-player-next`
- Status: complete
- Experiment: `ufs_learned_player_five_games_v22`

## Objective and result

The exact V20 revision-1 learned player was required to play five additional complete games.  Each
terminal game had to be captured once, and the next game had to start from that new revision.  The
primary question was whether Game 5 improved over Game 1.

The chain completed without a system blocker or UFS core change.  The answer is **no improvement**:
all five games produced the same formal Round-7 mothership loss and the same terminal/process
metrics.  Learning persistence is proven; learned-feedback activation and behavioral improvement
are not.

## Frozen provenance

- Source profile:
  `../ufs_revision1_vs_fresh_control_v21/profiles/treatment-v20-revision1.json`.
- Source SHA-256 before and after the experiment:
  `a1c3a2f13257cd89eea08581137ad1fedbd0b81addda0eff5a0ee4a4e9b8d92c`.
- Source state: player `ufs-v20-fresh-player`, revision 1, episodes captured 1, 54 learned
  trajectories, 9 connection updates, 189 ledger entries, attention seed `2026082920`.
- New random-tape seed: `2026082922`, keyed by pending type + occurrence + sorted die ordinal.
- Tape SHA-256:
  `87af864441a322a5f766151e66feb60a4845b8d2a26905e6abad3bdc709d81d5`.

The source profile was copied byte-for-byte into Game 1's input profile and never overwritten.
No V21 state, three-round checkpoint/capture, old fb2 artifact, or fifteen-day-web branch entered
the episode chain.

## Execution chain

| Game | Input profile revision | Episode | Terminal | Captured output |
|---:|---:|---|---|---:|
| 1 | 1 | `episode-0002` | Round-7 loss | revision 2 |
| 2 | 2 | `episode-0003` | Round-7 loss | revision 3 |
| 3 | 3 | `episode-0004` | Round-7 loss | revision 4 |
| 4 | 4 | `episode-0005` | Round-7 loss | revision 5 |
| 5 | 5 | `episode-0006` | Round-7 loss | revision 6 |

Before each capture, `verify-game.js` checked terminal outcome, sequence continuity, public
operation legality, replayable randomness, 100% prediction coverage, transcript counts, restored
formal state, and zero pending tickets.  `capture-game.js` then wrote a new, previously nonexistent
output profile.  A post-capture audit checked the single receipt and revision/episode increment.
The next game's input is an exact byte copy of the preceding output profile.  Five real state paths
are distinct.

The final revision-6 profile reports six total captured episodes (the original V20 episode plus
these five), 639 experienced operations, 146 learned trajectories, 11 connection updates, zero
attention adjustments, and 959 prediction-ledger entries.  It contains cognition and episode
summary history, not the formal board/checkpoint.

## Player boundary and action evidence

Choices used the latest compact public response, public-memory cells/rooms previously observed in
the same episode, `operationContracts`, and stable rules only.  The controller did not read the
formal checkpoint, private attention transcript, private feedback transcript, or profile internals
until terminal.  Random observations were materialized from the committed tape, never selected by
outcome.

Each game contains 105 public records: one `player-start`, 91 deliberate choices, and 13 random
observations.  Every deliberate choice carried 1 explicit prediction; coverage is 91/91 in every
game.  There were zero rejected/invalid operations and no nonzero CLI exits.  Each `DECISIONS.md`
contains one before-operation entry per public record.

Game 1's first 14 actions were driven live while the reusable controller was being instantiated;
from its next-round boundary onward `autoplay-game.js` continued it, and Games 2-5 used that driver
from `player-start`.  This is a procedural interface difference worth recording.  It was not an
algorithm or UFS learning-system change, no game was restarted, and the audit found zero submitted
behavior differences and zero normalized public-view differences between Games 1 and 5.  Thirteen
optional prediction-rationale strings differ; IDs, operation values, expectations, random values,
and formal responses do not.  Games 2-5 are fully identical even including prediction payloads.

## Metrics and comparison

All five games share:

- formal outcome `loss / mothership_reached_skull_row`, Round 7;
- terminal damage 5, energy 3, research 7, excavator 0, mothership 11;
- 104 accepted operations, 0 rejected/invalid;
- prediction dispositions 76 confirmed, 34 contradicted, 37 unresolved, 7 ambiguous;
- minimum energy 1 and zero entries into a zero-energy trap;
- seven temporary partial two-cell-energy placements, all completed before room resolution;
- zero incomplete energy rooms at the room boundary;
- one actual research rollback and two late mothership-danger room endings;
- zero actual `feedback-*` trajectory activations.

Game 1 added 81 trajectories and 2 connections.  Game 2 added 11 trajectories and no connection.
Games 3-5 added neither, although each added the same 154 prediction-ledger entries.  No episode
added an attention adjustment or quarantine.  All final 146 feedback trajectories remain
`pending_matrix_compile`.

The exact Game-1-vs-Game-5 audit is: 0 public-view divergences, 0 behavior-payload divergences,
0 random-payload divergences, identical formal tracks, identical hazard counts, identical
prediction dispositions, and 0 vs 0 learned-feedback activations.  Therefore:

1. **Saved:** yes—five revision/capture transitions are continuous and isolated.
2. **Activated:** no—no stored `feedback-*` trajectory issued an actual prediction ticket or
   appeared in the public decision path.
3. **Improved:** no—Game 5 is not better than Game 1 on any preregistered outcome or process
   measure.

The zero activation is consistent with all feedback trajectories remaining uncompiled, but the
experiment does not isolate compilation as the sole cause.  One deterministic tape also does not
support population-level claims over other random schedules.

## Files and evidence

- `PROTOCOL.md`: preregistered metrics, policy, isolation, and no-rerun contract.
- `random-tape.json`: frozen replayable schedule.
- `record-game-step.js`, `materialize-random-observation.js`, `autoplay-game.js`: public-only
  recorder/controller.
- `verify-game.js`, `capture-game.js`, `audit-five-games.js`: per-game and five-chain auditors.
- `records/game-01` through `records/game-05`: ledgers, decisions, payloads, evidence, random
  observations, audits, and capture records.
- `states/game-01` through `states/game-05`: isolated sealed episode checkpoints/transcripts.
- `profiles/`: immutable per-game input and output profiles.
- `AUDIT_SUMMARY.json`: complete machine-readable metric and comparison result.
- `RESULTS.md`: concise human-readable conclusion.

## Validation

- `node audit-five-games.js`: passed; five terminal games, revisions 1→6, one capture each, five
  isolated states, exact random contract, valid records, and final conclusion.
- Full UFS suite across 14 test files: 137/137 passed.
- No UFS learning algorithm or formal engine source was changed for this experiment.
- `git diff --check`: recorded in the coop handoff after documentation completion.

## Residual risks

- This is one repeated keyed schedule, not a multi-seed statistical estimate.
- The live-vs-driver prediction prose difference in the first 13 Game-1 deliberate payloads means
  literal prediction JSON is not perfectly paired, although actions, public observations,
  expectation coverage/dispositions, and outcomes are paired.
- The controller protected a 1-energy floor and handled partial energy rooms, but never advanced
  the excavator; the unchanged loss is a real strategy limitation, not a pipeline blocker.
- Repeating unactivated feedback storage cannot demonstrate what behavior would do after those
  trajectories are compiled into the active matrix.

