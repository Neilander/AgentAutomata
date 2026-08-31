# UFS V24 single-step planner: two-game result

Date: 2026-08-29

## Short conclusion

The experiment was worth running before adding multi-step search. It gives three distinct answers:

1. The single-step multi-candidate planner is real and can play terminal games, but it did **not**
   produce a clear gameplay improvement over the fixed controller.
2. The repaired feedback loop is real: Game 2 applied formally audited personal feedback to
   candidate scores at every choice and numerically changed 84 candidates.
3. The learning did **not** improve Game 2 over Game 1, because no feedback adjustment changed the
   winning candidate. Both games made the same 125 choices and ended identically.

## Valid paired run

Attempt 2 started from the real learned revision-7 profile and used attention seed `2026082920` and
the keyed external random tape seed `2026082924` for both games.

| Metric | Game 1: rev 7→8 | Game 2: rev 8→9 |
|---|---:|---:|
| Records | 147 | 147 |
| Planned choices | 125 | 125 |
| Rejected operations | 0 | 0 |
| Compiled feedback rows at end | 275 | 275 |
| Choice boundaries with usable feedback adjustment | 0 | 125 |
| Feedback applications to candidates | 0 | 598 |
| Candidates whose numeric score changed | 0 | 84 |
| Winning candidates whose numeric score changed | 0 | 0 |
| Choices changed relative to no-feedback ranking | 0 | 0 |
| Terminal result | loss: maximum damage | loss: maximum damage |
| Terminal round | 11 | 11 |
| Energy / damage / research / excavation / mothership | 2 / 7 / 0 / 0 / 10 | 2 / 7 / 0 / 0 / 10 |

Game 1 created 129 new trajectories, growing `146→275`; all 275 were compiled before capture.
Its 273 new ledger entries contain zero observed scalar-track results accidentally stored as
`undefined`. Game 2 reused those rows: 598 feedback applications used 124 unique trajectories;
84 candidate scores changed numerically (74 up, 10 down), with maximum absolute delta `42.204951`.
No winner changed score, so behavior and terminal results remained identical.

## Same-tape fixed-controller baseline

The historical fixed controller was also run with attention seed `2026082920` and the same keyed
V24 random tape. It used the same frozen cognition without private feedback, matching the old
controller's actual selection dependency.

| Metric | Fixed controller | Single-step planner |
|---|---:|---:|
| Result | loss | loss |
| Loss reason | mothership skull row | maximum damage |
| Terminal round | 8 | 11 |
| Energy | 2 | 2 |
| Damage | 5 | 7 |
| Research | 9 | 0 |
| Excavation | 0 | 0 |
| Mothership row | 11 | 10 |
| Zero-energy observations | 0 | 0 |

This is a mixed tradeoff, not a gameplay improvement. The planner survived three more rounds and
delayed mothership loss, but made no research progress, accumulated maximum damage, and still lost.

## Why the one-step planner failed strategically

The machine records make the horizon problem concrete:

- Each planner game placed 55 dice and resolved 47 rooms, but never reached a single
  `choose_research_advance` operation.
- A placement trial stops at the next boundary. Most placements therefore have identical immediate
  track utility even though they create very different future rooms.
- Stable tie-breaking repeatedly selected the lexically early AA cells. The planner could evaluate
  immediate ship movement and later room resolution, but it could not connect the current die
  placement to the value of completing an energy or research room several choices later.
- Feedback correctly confirmed and corrected candidate consequences in Game 2, but those local
  consequences did not contain a better multi-action plan. It changed many non-winning scores
  without changing the first-ranked action.

The result therefore justifies the next step rather than skipping validation: the next planner
needs to carry each placement branch through the remaining dice and room-resolution sequence.

## Bugs exposed before the valid run

The preserved unnumbered Attempt 1 stopped before a valid comparison and exposed two existing
boundary defects:

1. A formally legal spawn choice could be absent from the cognitive fork and was incorrectly
   removed as illegal. Formal enum choices now remain selectable with an explicit neutral,
   low-reliability imagination result.
2. `submit_round_roll` correctly started a clean cognitive round and then immediately overwrote it
   with a merge based on the previous round, restoring old dice and placements. The duplicate
   rebase is removed and the regression now asserts that mental dice and placements are clean.

Attempt 1 files are preserved; only Attempt 2 is included in the result conclusion.

## Evidence

- `attempt-02/RESULTS.json`: paired game machine summary.
- `attempt-02/AUDIT.json`: profile, matrix, ledger, plan and baseline audit (`passed: true`).
- `attempt-02/records/`: all submitted operations and public responses.
- `attempt-02/records/*/plans/`: complete read-only candidate rankings before every choice.
- `attempt-02/fixed-baseline/RESULTS.json`: same-seed/same-tape fixed-controller result.
