# Agent Handoff: Design Width Evaluator Skill

- Date: 2026-07-02
- Agent/thread: Codex desktop
- Scope: project skill for judging design application width
- Status: complete

## User Intent

The user identified that the previous affix usage-case calculation was wrong because it counted slot coverage instead of real mechanic users. They asked for a reusable skill to judge a design element's application width:

1. Find current application scenarios.
2. Analyze future possible users.
3. Use an extreme saturation test, for example:
   - all units having fire damage is acceptable because fire is mostly a damage type;
   - all units having stealth/hidden would break targeting and combat readability, so stealth should not be broadly shared.

## Completed

- Added a new project skill: `design-width-evaluator`.
- Registered the skill in `projects/western_fantasy_continent/skills/README.md`.
- Linked the skill from the weapon/archetype affix audit report.

## Files Changed

- `projects/western_fantasy_continent/skills/design-width-evaluator/SKILL.md`: new reusable workflow.
- `projects/western_fantasy_continent/skills/README.md`: added skill listing.
- `projects/western_fantasy_continent/design/equipment_progression/weapon-and-archetype-affix-audit-2026-07-02.md`: referenced the new skill for future affix review.
- `coop_repo/reports/2026-07-02_0015_design-width-evaluator-skill.md`: this coordination report.
- `coop_repo/LATEST.md`: updated to point to this report.
- `coop_repo/REPORT_INDEX.md`: indexed this report.

## Validation

- Manual file review.
- The skill has valid YAML frontmatter with `name` and `description`.
- The skill includes the user-required two-step process and the extreme saturation test.

## Current State

Use this skill before adding shared keywords, loot affixes, common mechanics, item stats, enemy mechanics, or reward types. It should prevent narrow one-class mechanics from polluting normal shared pools.

## Unresolved

- This is a workflow skill only; it does not yet include an automated parser or report generator.
- Existing affixes have not yet been redesigned using this skill.

## Recommended Next Step

Run `design-width-evaluator` on the four under-covered affixes from the audit:

- `fireAmp`
- `stealthDuration`
- `lowHpDamage`
- `auraPower`

Then decide whether each should be broadened to a second real role, gated by rarity/slot/role, moved to a class-exclusive pool, or removed from normal drops.
