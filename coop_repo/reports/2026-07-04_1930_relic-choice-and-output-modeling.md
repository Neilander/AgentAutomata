# Agent Handoff: Relic Choice And Output Modeling

- Date: 2026-07-04
- Agent/thread: Codex special relic design follow-up
- Scope: Add good-relic design checks and combat output modeling guidance to project skills.
- Status: complete

## User Intent

The user clarified that avoiding bad relics is not enough. A good relic should create a strong "my build choice made me powerful" feeling, and AI agents need executable checks rather than human-facing prose. The user also supplied a rough auto-battle output model to support mathematical analysis of relic payoffs.

## Completed

- Added `Build Choice Resonance` guidance to `special-relic-design`.
- Added a required check for:
  - player choice being rewarded;
  - specific build pattern;
  - why the relic is not generic power;
  - what loop becomes more complete;
  - what player-facing power moment appears.
- Added `Keyword Budget` guidance to `special-relic-design`.
- Documented that relic concepts should split trigger and payoff keywords, target four or fewer simple keywords, and simplify by modeling the intended payoff variable rather than blindly deleting words.
- Added the rough auto-battle output model to `phenomenon-math-modeling`:
  - `Total output ~= (basic damage * attack-speed coefficient + skill damage / attack-speed coefficient) * survival time`.
- Added low-health / lifesteal / damage modeling notes explaining recursive feedback between damage, lifesteal, survival time, and total output.

## Files Changed

- `projects/western_fantasy_continent/skills/special-relic-design/SKILL.md`: added build-choice resonance and keyword-budget concept checks.
- `projects/western_fantasy_continent/skills/phenomenon-math-modeling/SKILL.md`: added the combat output heuristic and low-health feedback diagnosis.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- Reviewed the changed skill sections directly.
- No runtime code, combat simulator code, or relic data was changed.

## Current State

Future relic design should use three layers:

- readability and target-scope checks;
- build-choice resonance and keyword-budget checks;
- math-modeling checks for multiplicative channels and positive feedback loops.

## Unresolved

- The ten earlier relic candidates have not yet been rewritten under the new AI-facing rules.
- No automated keyword extractor or relic modeling checker exists yet.

## Recommended Next Step

Re-audit the ten candidate relics by extracting trigger/payoff keywords, mapping each payoff to output variables, and rewriting any concept that exceeds the keyword budget or creates unintended positive feedback.
