# Candidate Merge Audit 2026-07-06_1752

Scope: Runs 1-7 in `projects/western_fantasy_continent/game_data/candidate_skill_packs`.

Goal: stop repeated brainstorm drift. This document groups candidates by combat fantasy, reinforcement route, and implementation pressure, then chooses representatives and archive rules.

## Summary

- Candidates reviewed: 70.
- Major duplicate/saturation clusters: 9.
- Main representatives worth carrying forward: 15.
- Component candidates worth preserving as skill/equipment/relic pieces: 16.
- Archive/defer candidates: the rest should not be implemented unless a later design need reopens that branch.

## Duplicate Clusters

### 1. Shield-To-Damage / Shield Cannon

Pattern: shields are not only defense; they charge an explosion, cannon, pulse, or counterattack.

- Main representative: **辉壁炮手** (`2026-07-06_1651`) as the clean backline shield-fed cannon.
- Secondary representative: **堡垒引信骑士** (`2026-07-06_1651`) as the front-line protector that converts intercepted damage into counter fire.
- Component candidates: **裂盾钟鸣**, **架盾反轰卫**, **辉盾炮卫**.
- Archive / defer: **熔芯护心镜**, **熔盾连弦卫**, **架盾换弹卫**, **盾炮拖刀卫**.
- Decision: saturated. Do not brainstorm more generic shield cannon. New work must add a different axis, such as cleanse shield, directional shield, shared shield battery, or anti-shield enemy.

### 2. Low-Health Ranged / Reload / Returning Projectile

Pattern: a fragile ranged carry gets stronger near death, often through reload, return path, or last-shot pressure.

- Main representative: **断脉弩客** (`2026-07-06_1651`) as the clearest low-health returning crossbow carry.
- Component candidate: **回钟弹术** (`2026-07-06_1651`) as a reusable return-projectile skill component.
- Component candidates: **饿血弩客**, **回镰行者**, **赤脉回旋手**, **压弹枪姬**, **压膛铳骑**.
- Archive / defer: **赤脉狂射手**, **青羽回旋镖手**.
- Decision: saturated. Do not brainstorm more "low HP ranged projectile comes back" until one representative is implemented and tested.

### 3. Frost Mark / Bounce / Shatter Ranger

Pattern: frost, mark, crit, and bouncing basics create a ranged carry loop.

- Main representative: **霜弦追猎者** (`2026-07-06_1651`) as the best readable frost/mark/bounce hunter.
- Component candidate: **寒星弹匣师** (`2026-07-06_1651`) as an attack-speed bounce package if the representative needs a more basic-attack-heavy variant.
- Component candidates: **霜裂跳矢**, **裂冠霜枪**, **白霜碎冠**.
- Archive / defer: **白霜影枪** until assassin/ranger bridge is needed; **冰踢碎刑者**, **低血冰踢者**, **白霜拖刀者** belong to a later melee frost branch.
- Decision: saturated for ranged. Melee frost can remain an open future branch, but do not generate more frost bounce archers.

### 4. DOT Spread / Epidemic Fire / Delayed Detonation

Pattern: DOT spreads, transfers on death, grows over time, or detonates after setup.

- Main representative: **黑钟疫使** (`2026-07-06_1651`) as the long-fight DOT carry with final bell detonation.
- Secondary representative: **余烬药剂师** (`2026-07-06_1651`) as the death-transfer epidemic version.
- Component candidates: **疫火邮差**, **腐萤牧毒者**, **回响毒瓶师**, **余烬瓶带**.
- Archive / defer: **旋身撒毒舞者** waits for poison melee ecology.
- Decision: saturated. Future DOT brainstorm must specify a new axis: single-target boss DOT, self-DOT conversion, DOT with movement, or DOT as defensive pressure.

### 5. Long-Cast / Delayed Burst Caster

Pattern: a caster needs setup time, protection, or delayed timing before a large payoff.

- Main representative: **星陨长咏者** / **石钟咏唱者** should be merged into one formal "long chant burst" template.
- Secondary representative: **裂痕咒炮手** (`2026-07-06_1651`) if the project wants the long-cast branch to tie into DOT pressure.
- Component candidates: **沙漏术师**, **短杖点星师**, **棺灯守咒者**, **玻璃大炮占星家**.
- Decision: saturated. Do not create more generic "read a big spell then explode" casters.

### 6. Basic-Attack Bounce / Multi-Hit Carry

Pattern: basic attacks bounce, chain, repeat, or trigger many small packets.

- Main representative: **银镜弹匠** (`2026-07-06_1438`) as the clean non-elemental bounce baseline.
- Secondary representative: **百手拳师** (`2026-07-06_1438`) as melee multi-hit basic baseline.
- Component candidates: **群星飞刀客**, **风刃游侠**, **回响弦戒**, **灰烬弹仓**.
- Decision: partially saturated. Future brainstorm should only create a new basic-attack branch if it changes the key question, such as stand-still vs move, front-loaded vs ramping, or single-target vs swarm.

### 7. Mark / Focus Fire / Team First-Hit

Pattern: one unit marks a target and the team or the owner gets a burst window.

- Main representative: **白烛判官** (`2026-07-06_1619`) as the clean mark-focused judgment carry/support.
- Component candidates: **青铜猎标**, **青羽猎标手**, **回响弦戒**.
- Decision: open but needs care. Mark is a resource keyword, not a full role by itself. Future ideas must state what mark changes: target choice, damage timing, team targeting, or trigger condition.

### 8. Heavy Charge / Dragged Blade / Stand-Still Hit

Pattern: slow setup, dragged weapon, standing still, or charged strike gives one heavy payoff.

- Main representative: **山息一刀** (`2026-07-06_1619`) as the clean stand-still draw / one-cut payoff.
- Secondary representative: **拖刀暮斩者** (`2026-07-06_1519`) as dragged-blade movement posture.
- Component candidates: **白霜拖刀者**, **盾炮拖刀卫**.
- Decision: not fully saturated, but visually risky. Future brainstorm should focus on readable action timing and counterplay, not just "bigger charged hit".

### 9. Trigger / Alternating / Rhythm Engine

Pattern: skills trigger basics, basics trigger skills, or alternating hands/elements produce rhythm.

- Main representative: **双手交替术士** (`2026-07-06_1519`) as alternating element rhythm.
- Secondary representative: **鸣雷指环** (`2026-07-06_1506`) as skill-crit-to-basic trigger equipment.
- Component candidates: **纸月连祷师**, **纸月符盒**, **双掌雷珠师**, **连祷焰术士**, **灰烬连珠术士**.
- Decision: still open. This is a good future space because it creates build questions around attack speed, skill haste, cooldown breakpoints, and trigger reliability.

## Saturated Directions: Ban For Next Brainstorm

Do not ask subagents for more generic versions of:

1. Shield cannon / shield breaks into damage.
2. Low-health ranged with returning projectile.
3. Frost bouncing archer.
4. Generic DOT spread / poison fire transfer.
5. Generic long-cast big explosion.
6. Generic mark hunter without a new mark function.

If one of these appears, screening should reject unless it changes the build question in a concrete way.

## Open Gaps Worth Brainstorming

1. Ailment identity beyond DOT: ignite one-big-hit, bleed movement pressure, poison stacking rules, shock as damage amplifier, brittle/fragile crit setup.
2. Deployed entities: traps, mines, temporary turrets, banners, constructs, totems.
3. Defensive output carries: output gained from blocking, healing received, cleansing, or resisting effects, not only shields.
4. Position and formation: line holders, flank punishers, corner casters, row-swappers, front/back pressure.
5. Resource conversion: overheal to damage, wasted shield to mana, excess crit to reload, kill overflow to next target.
6. Enemy/ecology tools: anti-summon, anti-shield, anti-DOT, anti-burst, as metagame pressure.
7. Support that changes output posture: not "more damage", but making a carry become bounce, execute, DOT, or safe channel.

## Implementation Shortlist

1. **辉壁炮手** + **堡垒引信骑士**: validates shield-as-ammo and protector battery.
2. **断脉弩客** + **回钟弹术**: validates low-health return projectile.
3. **霜弦追猎者**: validates frost mark bounce.
4. **黑钟疫使** + **余烬药剂师**: validates two DOT branches, long-fight and death-transfer.
5. **山息一刀**: validates readable charged heavy strike.
6. **双手交替术士**: validates rhythm/alternating engine.

## Process Rule For Future Brainstorm

Before any new brainstorm prompt, add a negative prompt:

> Do not generate shield cannons, low-health returning archers, frost bouncing archers, generic poison/fire DOT spreaders, generic long-cast explosions, or plain mark hunters unless the design changes the player's build question.

The generator should first choose an open gap, then produce candidates inside that gap.
