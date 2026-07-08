# Agent Handoff: Support Field Effect Rules And Four-Ranged Test

- Date: 2026-07-08
- Agent/thread: Codex
- Scope: update field-effect-design skill with support-oriented constraints and test four-ranged baseline strength
- Status: complete

## User Intent

User identified that support-oriented field effects should favor or disfavor one to two roles, not whole output styles. User also warned that a field effect is bad if it rewards a mainstream option while using an already weak playstyle as the negative contrast. User asked to record these rules and test whether four-ranged teams are actually weak.

## Completed

- Updated `field-effect-design` with three new support-oriented rules:
  - Support-oriented effects should reward support/counter swaps, usually one or two roles.
  - Do not state or imply that an entire output style cannot pass.
  - Do not reward mainstream play while punishing an already weak option; test suspected weak baselines before using them as negative contrast.
- Ran a combat simulation check for several four-ranged teams against:
  - 8 standard teams from `field-effects.js`;
  - 500 normal mob waterline teams from `game_data/team_pools/mob-waterline-db.json`;
  - 120 super waterline teams from `game_data/team_pools/mob-waterline-super-db.json`.

## Files Changed

- `projects/western_fantasy_continent/skills/field-effect-design/SKILL.md`: added support-oriented field-effect constraints.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

Ad-hoc Node simulation using `game_data/combat-sim.js` and `game_data/field-effects.js`.

Normal waterline results:

| Team | Roles | Normal waterline win rate | Avg score |
| --- | --- | ---: | ---: |
| Balanced core | warrior, knight, mage, priest | 55% | 53% |
| Four ranged damage | ranger, mage, warlock, alchemist | 54% | 41% |
| Four ranged control | ranger, mage, alchemist, bard | 30% | 25% |
| Four ranged support | ranger, mage, priest, bard | 16% | 14% |
| Four ranged double ranger | ranger, ranger, mage, bard | 53% | 47% |

Standard-team results:

| Team | Standard win rate | Avg score |
| --- | ---: | ---: |
| Balanced core | 38% | 37% |
| Four ranged damage | 63% | 47% |
| Four ranged control | 38% | 30% |
| Four ranged support | 25% | 10% |
| Four ranged double ranger | 50% | 47% |

Super waterline is too high for this baseline comparison: balanced core also scored 0% win rate there, so it is not useful for judging whether four-ranged is inherently weak.

## Current State

The test does not support treating "four ranged" as a universally weak playstyle. Some four-ranged damage formations are roughly comparable to the balanced core against the normal waterline. The weak cases are specifically four-ranged teams that lack front pressure and lack enough damage payoff, such as `ranger/mage/priest/bard`.

## Unresolved

- Need a persistent small test script if this comparison becomes a repeated workflow.
- Field-effect proposals should avoid using "all ranged" as the poor-benefit side unless the exact ranged composition is specified and tested.

## Recommended Next Step

Revise the fifth proposed field effect (`Iron Boots Battlefield`) framing: do not say it punishes all-ranged teams. Frame it as benefiting teams that add one contact/front-pressure role, and test against specific no-contact ranged-support variants rather than the whole ranged output style.
