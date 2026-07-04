# Agent Handoff: Special Relic Design Skill

- Date: 2026-07-04
- Agent/thread: Codex special relic design pass
- Scope: Record the user's special relic aesthetic and validation method as a project skill.
- Status: complete

## User Intent

The user reviewed the first ten special passive ideas and accepted the direction, but pointed out that some were too narrow. The user clarified the desired relic ecology:

- about 20% should be broadly usable;
- about 40% should be usable by roughly three roles/classes/build families;
- about 40% can be dedicated to one specific build;
- every relic should be tested in target and non-target teams;
- testing should cover no gear, mid epic gear, and high divine/mythic gear;
- future work can add relic-combination testing later.

## Completed

- Added a new project skill: `special-relic-design`.
- Captured the 20/40/40 design-width target for relic batches.
- Defined relic classifications:
  - general;
  - medium-width;
  - build-specific.
- Added a required test matrix:
  - target team;
  - near-target teams;
  - non-target teams;
  - 0 equipment;
  - half equipment;
  - full equipment.
- Added acceptance heuristics for each width class.
- Added batch review checks so a future agent can see when relics are too universal, too narrow, or overusing one keyword.
- Linked the skill from the project skill index.

## Files Changed

- `projects/western_fantasy_continent/skills/special-relic-design/SKILL.md`: new skill with design and validation workflow.
- `projects/western_fantasy_continent/skills/README.md`: added the skill to the project skill list.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report and preserved the previous app-shell report entry.

## Validation

- Read `skill-creator` guidance before creating the skill.
- Checked the new skill frontmatter and trigger description.
- Checked the project skill README entry.
- Confirmed this task did not edit shared combat, skill, build-layer, or equipment runtime data.

## Current State

Future agents should use `projects/western_fantasy_continent/skills/special-relic-design/SKILL.md` before designing special challenge rewards, unique passive equipment, or build-unlocking relics.

The skill is intentionally procedural only. It does not implement relics, loot tables, challenge stages, or combat runtime hooks yet.

## Unresolved

- No simulation script exists yet for relic target/non-target testing.
- Relic-combination testing is explicitly deferred.
- The first ten example relics still need a review pass under this skill before implementation.

## Recommended Next Step

Re-review the ten proposed special passives with `special-relic-design`, classify them into the 20/40/40 mix, then choose a small first implementation batch for challenge first-clear rewards.
