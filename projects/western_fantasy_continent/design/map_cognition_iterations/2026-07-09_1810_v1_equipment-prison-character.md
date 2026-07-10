# Map Cognition Iteration V1: Equipment To Prison Character

- Time: 2026-07-09 18:10 UTC heartbeat
- Scope: first early-map cognition slice
- Status: draft pending dual review merge

## This Iteration's Target Concepts

Introduce only the first small cognition chain:

```text
关卡战斗 -> 装备 -> 换装备 -> 战力 -> 监狱/角色预告 -> 营地装备钥匙 -> 监狱角色钥匙 -> 主线过程墙验证
```

Deferred concepts:

```text
稀有度深层理解, 场地效果, 辅助角色克制, 装备等级系统化理解, 词条, 细分职业, 藏品, 属性导向配装, 战场配比
```

Reasoning:

Early design should avoid asking the player to understand role counterplay before they have proof that equipment changes outcomes and that prisons can reward characters.

## Entering Cognition Model

Initial assumed player cognition before map start:

```text
concepts:
  - 关卡
  - 战斗

knowledge:
  - 打关卡会推进地图

behaviors:
  - 挑战当前关卡

failure_memories:
  - none
```

Action model:

```text
The player challenges the only visible mainline level because it is the only known behavior.
New no-cost behaviors are likely to be tried.
Costly/risky branch fights need either curiosity, visible reward, or a failure memory.
```

## Proposed Map Segment

Use first region only. Starting region has no entrance gate.

```text
M1: 狼径巡哨
  purpose: first combat, no failure pressure
  reward: one plain equipment piece
  cognition gain:
    concepts +装备
    behaviors +换装备

M2: 破篱小队
  purpose: validate equip behavior
  reward: another plain equipment piece
  target: after equipping 1-2 items, power rises about 10-20%
  cognition gain:
    concepts +战力
    knowledge +装备能提高战力
    first impression: equipment gives small stackable gains

M3: 哨塔杂兵
  purpose: let player repeat challenge/equip loop
  reward: plain equipment, maybe first visible rarity label but not explained deeply
  cognition gain:
    knowledge update: multiple slots mean small equipment gains can stack

M4: 断桥路障
  purpose: unlock side branch
  reward: unlock 强盗营地
  cognition gain:
    concepts +强盗营地
    behaviors +挑战营地
    knowledge +营地给装备

Camp A: 强盗营地
  unlock: after M4
  difficulty: slightly above M4, below first prison after 1-2 equipment swaps
  reward: high-level white gear + one blue item
  role: equipment key for prison lock
  cognition gain:
    knowledge update: some equipment rewards are larger than ordinary drops
    possible first impression shift if total equip action raises power >=30%

M5: 监狱外岗
  purpose: unlock prison concept, not yet teach role value
  reward: unlock 监狱
  cognition gain:
    concepts +监狱 +角色
    behaviors +挑战监狱
    knowledge +监狱打过能救出角色

Prison A: 旧塔监狱
  unlock: after M5
  difficulty: likely fails before camp reward or extra farming
  role: lock whose treasure is first rescued character
  intended first failure attribution:
    primary: 战力不足
    secondary: none or 装备还不够
  reason: player has not yet learned that new characters are a big power axis
  wake condition:
    if current_power >= prison_failure_power * 1.3, prison retry begins to wake
    if current_power >= prison_failure_power * 2.0, prison retry should be guaranteed
    if retry fails, refresh baseline
  reward on success: first rescued character, preferably a simple support or ranged output with obvious role text
  cognition gain:
    knowledge +监狱能给角色
    behaviors +调整队伍/上阵新角色
    knowledge first impression: character can change team function

M6: 回路清剿
  purpose: low-pressure validation after prison or camp
  role: catch-up mainline, not a hard lock
  reward: normal equipment

M7: 碎盾拦截
  purpose: first process wall after prison
  difficulty: tuned so either first rescued character OR enough equipment farming can pass
  lock:
    perceived obstacle to mainline progress
  keys:
    key A: rescued character from Prison A
    key B: repeated equipment farming/equipping
  treasure:
    mainline progress and access to later map section
  cognition gain on success with character:
    knowledge update: characters can solve some fights beyond raw power
  cognition gain on success with gear:
    knowledge update: enough equipment stacking can brute-force some walls

M8-M10:
  purpose: consolidate the loop, do not introduce field effects yet
  rewards: equipment and small resource rewards

Boss A:
  purpose: synthesis test, not first character tutorial
  requirement: player should already know equipment and character exist
```

## Lock-Key Chain

Primary layered chain:

```text
Camp A equipment -> unlocks Prison A success
Prison A character -> unlocks M7 process wall success
M7 success -> unlocks later map/Boss preparation
```

Treasure definitions:

```text
Camp treasure: larger equipment power jump
Prison treasure: first new character
M7 treasure: proof that team change or sufficient gear opens mainline progress
```

Lock definitions:

```text
Prison A lock:
  The player wants a new character after seeing the prison reward, but loses because current power is too low.

M7 lock:
  The player wants to continue mainline, but hits a process wall that can be solved by new character or gear stacking.
```

Key definitions:

```text
Camp A is key for Prison A because it gives a large enough equipment jump to wake and solve the prison failure.
Prison A is key for M7 because it gives a character after the player has learned characters exist.
Equipment farming is fallback key for both Prison A and M7.
```

## Failure Memories

### Failure Memory 1: Prison A

```text
failed_object: Prison A
baseline_state:
  power: prison_attempt_power
  known_concepts: 关卡, 战斗, 装备, 战力, 强盗营地, 监狱, 角色
  known_knowledge:
    - 装备能提高战力
    - 营地给装备
    - 监狱打过能救角色
attribution:
  primary: 战力不足
  secondary:
    - 装备还不够
wake_conditions:
  - current_power >= baseline_power * 1.3: retry chance starts
  - current_power >= baseline_power * 2.0: retry should happen
on_retry_fail:
  refresh baseline_power
```

### Failure Memory 2: M7 Process Wall

```text
failed_object: M7 碎盾拦截
baseline_state:
  power: m7_attempt_power
  team: current active team
known_concepts:
  - 装备
  - 战力
  - 监狱
  - 角色
known_knowledge:
  - 装备能提高战力
  - 监狱能给角色, if Prison A already cleared
  - 角色能改变队伍功能, if rescued character was equipped before attempt
attribution:
  primary:
    - if no rescued character: 战力不足
    - if rescued character exists but not used: 可能需要换人/上阵新角色
    - if rescued character used and still fails: 战力不足 or 队伍配置不足
secondary:
    - 装备还不够
wake_conditions:
  - +20-30% power can wake retry if only power attribution exists
  - equipping the rescued character should wake retry immediately because it is a new behavior with low/no cost
on_retry_fail:
  refresh baseline and keep character-use knowledge weaker until success
```

## Knowledge Updates

```text
After M1:
  concepts +装备
  behaviors +换装备

After first equip:
  concepts +战力
  knowledge +装备可以提升战力
  first impression: equipment is small but stackable

After Camp A reward:
  if total equip delta >=30%:
    update equipment knowledge to "some equipment rewards can create large jumps"
  else:
    keep "small stackable gains"

After M5:
  concepts +监狱 +角色
  behaviors +挑战监狱
  knowledge +监狱打过能救角色

After Prison A success:
  behaviors +调整队伍/上阵角色
  knowledge +角色能改变队伍功能
  first impression: role changes are meaningful but still simple

After M7 success:
  if using rescued character:
    update knowledge: "some walls can be solved by changing team, not only by more power"
  if using gear fallback:
    update knowledge: "gear stacking can brute-force early walls"
```

## Playtest / Review Feedback

### Agent A: Player Cognition Naturalness

Severity: `serious`

Findings:

- The core chain is directionally correct.
- Main risk: `Camp A` can be consumed before the player has seen or failed `Prison A`. If this happens, camp becomes a generic side reward rather than a remembered key for a lock.
- `M7` asks too much of the first character if there is no low-pressure role trial first.
- "Team composition insufficient" is too advanced as an early attribution. Early failure should remain mostly "power/equipment insufficient" until the player has seen a role-change success.

Recommended fix:

```text
Show or unlock Prison A before or alongside Camp A.
Let Prison A create a failure memory.
Then let Camp A act as the visible equipment key.
After Prison A success, add M6 as a low-pressure role trial.
Only then use M7 as a process wall that can be solved by character use or enough equipment.
```

### Agent B: Lock-Key / Pacing

Severity: `minor`

Findings:

- The static lock-key chain is clear.
- Boss correctly does not carry the first role/character tutorial.
- The key timing has the same early-release risk: M4 camp before M5 prison can make the equipment key lose its lock relationship.
- Camp/farming are both equipment-number solutions for Prison A, so they are not heterogeneous solutions for that specific prison lock. This is acceptable because Prison A's purpose is to teach equipment as key to character reward.
- M7/M8 can provide the first true heterogeneous solution: new character function vs enough equipment.

Recommended fix:

```text
Make Prison A visible first or at least visible at the same time as Camp A.
Tune Prison A so pre-camp attempt usually fails but not hopelessly.
Tune Camp A reward to produce about +30%-50% total power, enough to wake Prison A retry.
Make M6 a low-pressure character-use proof.
Make M7/M8 lightly favor the rescued character while preserving equipment brute force.
```

## Macro Judgment

Skill-model problem:

```text
minor: the review format should explicitly distinguish "static chain valid" from "cognitive timing valid".
```

Design problem:

```text
serious in v1: Camp A can appear before the Prison A failure memory, so the intended key may be consumed before the lock is understood.
```

Review-method problem:

```text
none: two subagents returned complementary findings.
```

## Rollback Decision

Current severe problem estimate:

```text
serious for this v1 ordering, but not blocker for the overall direction
```

Current recommendation:

```text
Create v1.1 rather than advancing to rarity/field effects.
```

## Skill Update Decision

Potential small future skill update:

```text
Add a timing distinction:
  static lock-key validity != cognitive lock-key validity.
A key is only cognitively a key if the player has seen, anticipated, or failed the corresponding lock before consuming it.
```

## Next Iteration Suggestion

If v1 passes:

```text
V2 should introduce rarity only as a visible reward quality difference, not as a deep optimization system.
Possible chain: ordinary equipment -> blue/purple reward expectation -> first role-aware character use.
```

If v1 fails:

```text
Retune the order of Camp A and Prison A, or make prison visible before camp but not practically solvable until camp/farming.
```
