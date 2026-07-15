# Agent Handoff: Chapter One Composition Validation Gap

- Date: 2026-07-15
- Agent/thread: Codex current task
- Scope: audit whether the accepted first-region Agent playtest covered a Warrior/Mage/Ranger offense stack
- Status: analysis complete; design issue confirmed

## User Intent

Determine whether the prior Agent validation actually tested loose or pure-output team composition, because the current human version appears beatable through largely arbitrary play.

## Completed

- Audited the retained July 14 role-swap session and its explicit team history.
- Confirmed the Agent never fielded Mage and Ranger together.
- The Mage phase used `hero_warrior, militia_barricade, hero_mage, militia_herb`.
- The Ranger phase replaced Mage in the same slot and used `hero_warrior, militia_barricade, hero_ranger, militia_herb`.
- Therefore the previous test only compared Mage versus Ranger inside a protected frontline/healer shell; it did not test a three-hero offense stack or the cost of dropping tank/healing.
- Ran a new zero-equipment, 100-seed composition audit without changing game data.

## Validation Evidence

Win counts out of 100:

| Team | Main4 | Main5 | Main6 | Main7 | Main8 | Main9 | Main10 | Boss |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Warrior + barricade + Mage + healer | 100 | 100 | 0 | 0 | 100 | 100 | 100 | 0 |
| Warrior + barricade + Ranger + healer | 100 | 100 | 9 | 29 | 100 | 100 | 100 | 0 |
| Warrior + Mage + Ranger + spear militia | 100 | 100 | 16 | 100 | 100 | 100 | 100 | 0 |
| Warrior + Mage + Ranger + healer | 100 | 100 | 0 | 100 | 100 | 100 | 100 | 0 |

## Diagnosis

- The accepted verifier stops its role-composition evidence at Main 7. It does not validate Main 8-10 composition pressure.
- The retained Agent preserved both a dedicated frontline and healer throughout; its success cannot demonstrate that arbitrary teams are punished.
- The core Agent flow auto-equipped loot, which further reduced the cost of a loose team compared with the human page's explicit equipment decisions.
- Main 7 correctly rewards owning Ranger, but does not distinguish a coherent Ranger team from simply stacking Ranger with the other complete heroes.
- Main 8-10 are composition-blind in this audit: all four team shapes won 100/100 with zero equipment.

## Current State

The first chapter's lock-key acquisition chain is mechanically verified, but the broader claim that the chapter teaches meaningful team construction is not verified and is currently contradicted by Main 8-10 results.

## Unresolved

- No enemy values, skills, drops, or level rules were changed during this audit.
- A correction needs explicit design goals per late-Chapter-1 node and a roster-combination validator, not another single Agent path.

## Recommended Next Step

Before tuning, define what Main 8, Main 9, Main 10, and Boss each test. Then enumerate every currently available four-slot team (or classify equivalent compositions), test them at the intended equipment state, and require each teaching node to separate its intended solutions from incoherent offense stacking without making the intended Ranger route mandatory everywhere.
