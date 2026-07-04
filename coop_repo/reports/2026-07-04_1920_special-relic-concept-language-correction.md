# Agent Handoff: Special Relic Concept Language Correction

- Date: 2026-07-04
- Agent/thread: Codex special relic design follow-up
- Scope: Correct special relic readability guidance so concept design stays simple before numerical balance.
- Status: complete

## User Intent

The user clarified that probability, stack caps, internal cooldowns, and once-per-battle limits should not be presented as the default way to design relics at this stage. The project is not yet in detailed numerical balance, so relic concepts should first be expressible as a clean one-sentence game action.

## Completed

- Replaced the earlier "simple limiter" list in `special-relic-design`.
- Added guidance to write the natural game action first, before tuning details.
- Added examples of acceptable concept-stage wording:
  - burn can spread to a nearby enemy;
  - shield break makes the target easier to focus;
  - low health grants lifesteal on the wearer's next attacks;
  - excess healing becomes a small shield.
- Clarified that probability, ratio, stack caps, internal cooldowns, and once-per-battle limits belong later, after validation shows the clean concept is too strong, too frequent, or unclear.

## Files Changed

- `projects/western_fantasy_continent/skills/special-relic-design/SKILL.md`: corrected effect readability guidance to prioritize one-sentence concept clarity over early numerical limiter design.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- Reviewed the changed skill section directly.
- No runtime code or relic data was changed.

## Current State

Future relic concepts should start as simple, readable game actions. Numerical controls are still valid implementation tools, but they should not clutter the first concept pass.

## Unresolved

- The 20 relic candidate batch still needs to be rewritten under the corrected concept-language guidance.
- No simulator validation exists yet for special relic uplift.

## Recommended Next Step

Redo the 20 relic candidate batch with one-sentence clean passives first, then only add numbers where needed for later testing.
