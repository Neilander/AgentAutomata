# Agent Handoff: Shadow Assassin Report Correction

- Date: 2026-06-29
- Agent/thread: Codex desktop
- Scope: Correcting the previous shadow assassin tuning conclusion
- Status: partial

## User Intent

The user challenged the previous conclusion, pointing out that the cited 4v4 result did not make sense if the assassin was actually using attributes. The concern was correct.

## Completed

- Re-read the generated route report and the route script.
- Confirmed `analyze-attribute-team-routes-v2.js` does apply route-derived combat stats through `unitSpec()`.
- Found the actual mistake: the previous handoff copied the assassin `2v2` table and labeled it as `4v4`.
- Updated task board entry `shadow-assassin-survival-tuning` back to `active`; the previous accepted conclusion is invalid.

## Correct Data

The table previously reported as "assassin 4v4" was actually `2v2`:

| Route | 2v2 Team Win |
| --- | ---: |
| `10副` | 57% |
| `7主3副` | 57% |
| `全分散` | 57% |
| `10坚韧` | 54% |

The real current assassin `4v4` result is:

| Route | 4v4 Team Win | Focus Damage | Focus Alive |
| --- | ---: | ---: | ---: |
| `10坚韧` | 46% | 265.8 | 14% |
| `10韧性` | 43% | 197.1 | 11% |
| `10副` | 39% | 228.2 | 7% |
| `3主7副` | 39% | 226.5 | 4% |
| `10主` | 39% | 213.6 | 7% |
| `5主5副` | 36% | 222.9 | 4% |
| `全分散` | 36% | 222.8 | 4% |
| `7主3副` | 36% | 221.8 | 4% |

Correct interpretation: current tuning did not solve the 4v4 shadow assassin route problem. It helped some checks, but 4v4 is still survival-led and expected shadow routes remain too low.

## Additional Correction From User

The manual waterline and standard-preset spot checks in the previous report used a favorable and inconsistent setup: only the tested assassin was converted through a 10-point route build, while the preset allies, preset opponents, and generated waterline opponents stayed on their stored/base combat stats.

That means those checks are not valid evidence that a built shadow-assassin team is strong. If anything, they are worse for the current candidate: even with the tested assassin receiving special route points while surrounding units did not, the result was still low or tenacity-led.

Use these checks only as rough matchup smoke tests. Do not use them as build-strength validation.

## Files Changed

- `projects/western_fantasy_continent/design/task-budget-board.json`: changed `shadow-assassin-survival-tuning` back to active and recorded the correction evidence.
- `coop_repo/reports/2026-06-29_1205_shadow-assassin-report-correction.md`: this correction report.
- `coop_repo/LATEST.md`, `coop_repo/REPORT_INDEX.md`: updated handoff pointers.

## Validation

- Manual code read:
  - `analyze-attribute-team-routes-v2.js` uses `unitSpec()` for the focal unit, random allies, and random enemies.
  - `unitSpec()` folds route points into concrete combat fields such as `hp`, `physicalPower`, `attackSpeedMult`, and `skillHasteMult`.
- Manual report read:
  - The `2v2` and `4v4` sections in `attribute-team-route-simulation-v2.md` were compared directly.

## Current State

The previous report `2026-06-29_1155_shadow-assassin-survival-tuning.md` should be treated as superseded for its acceptance verdict. The code changes from that pass still exist, but their outcome is not accepted.

## Unresolved

- Need a proper next tuning pass against the real 4v4 route table.
- Need a fairer full-team attribute waterline if the intended test is "all four characters in a constructed team have attribute builds", not just the focal assassin. The previous manual waterline did not satisfy this.

## Recommended Next Step

Use the real 4v4 table as the budget target: expected shadow routes need to rise from `36-39%` toward at least parity with `10坚韧 46%`, preferably without increasing `10坚韧` further. For waterline validation, either convert every unit in both teams through the same attribute-build layer or explicitly label the test as focal-only.
