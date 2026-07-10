# Map Cognition Iteration V2: Rarity As Reward Quality

- Time: 2026-07-09 18:48 UTC heartbeat
- Basis: V1.1 equipment -> prison -> first character chain
- Status: draft pending dual review merge

## This Iteration's Target Concepts

Add one concept only:

```text
稀有度 = reward quality / expectation signal
```

Do not teach yet:

```text
词条优化, 装备等级体系, 场地效果, 辅助角色克制, 细分职业, 藏品, 属性导向配装
```

Reason:

After V1.1, the player knows equipment can raise power and that some equipment sources can create larger jumps. Rarity can now serve as a lightweight visual explanation for why Camp A rewards feel better than ordinary mainline drops.

## Entering Cognition Model

Assume V1.1 has been completed or mostly completed.

```text
concepts:
  - 关卡
  - 战斗
  - 装备
  - 战力
  - 监狱
  - 角色
  - 强盗营地

knowledge:
  - 打关卡会推进地图
  - 装备能提高战力
  - 普通装备是小幅、可叠加的战力提升
  - 营地给更好的装备
  - 监狱打过能救角色
  - 新角色可以上阵
  - 如果 M5 已用过新角色: 角色能改变队伍功能

behaviors:
  - 挑战当前关卡
  - 换装备
  - 挑战监狱
  - 挑战营地
  - 上阵新角色

failure_memories:
  - Prison A, if failed before camp:
      attribution: 战力不足 / 装备还不够
      wake: current_power >= baseline * 1.3
  - M6 process wall, if failed:
      attribution depends on whether character has been used
```

## Design Principle For Rarity

Rarity should answer:

```text
Why did this reward feel bigger than normal?
```

It should not yet ask:

```text
Which affix line is better?
Which build wants this item?
How do I optimize a full gear set?
```

Player-facing first impression:

```text
白装 = ordinary useful gear
蓝装 = usually better / more exciting reward
紫装 = branch or milestone reward, likely a big jump
```

Knowledge update rule:

```text
If a blue/purple item causes >=30% power gain, update rarity knowledge:
  higher rarity can create larger jumps
If a blue item does not beat current gear:
  keep rarity as "higher chance of useful reward", not guaranteed upgrade
```

## Revised Segment Additions

### M1-M3: Keep Rarity Mostly Invisible

Rewards:

```text
mostly white/plain equipment
```

Reason:

The player should first learn equipment and power, not color taxonomy.

Possible UI:

```text
ordinary item cards can have plain borders, but no rarity explanation panel.
```

### M4: Rarity Foreshadow Through Camp Preview

When M4 reveals Prison A and Camp A together, show Camp A reward preview:

```text
旧塔军械营地
奖励预览: 高等级白装 + 蓝装
```

Cognition update:

```text
concepts +蓝装
knowledge +营地奖励比普通关卡更好
```

Important:

Do not explain affixes. Do not make the player choose between blue items yet.

### Camp A: First Blue Reward

Reward:

```text
2 high-level white items + 1 blue item
```

Tuning:

```text
Useful total power gain should be +30%-50% if the player equips the best obvious upgrades.
The blue item should usually be one of the obvious upgrades, but the package can still work if a white high-level item is the main upgrade.
```

Knowledge update:

```text
concepts +稀有度
knowledge:
  - 蓝装通常比普通掉落更值得看
  - 营地/支线更容易给高质量奖励
first impression:
  rarity is a reward-quality signal, not a build puzzle
```

### Prison A Retry

Rarity's role:

```text
Rarity should support the existing wake-up, not replace it.
The retry is awakened by power gain, while rarity explains why camp rewards produced the gain.
```

Failure memory update:

```text
If Prison A succeeds after Camp A:
  update Prison A memory: equipment quality solved the prison lock
  keep role knowledge for after character reward
```

### M5 Character Trial

No new rarity teaching.

Reason:

M5's job is role proof. Do not split attention between character and rarity.

### M6 Process Wall

Optional reward preview:

```text
First clear reward: one blue item
```

Role:

```text
After passing M6, blue item reinforces "harder milestones give better reward quality".
```

Do not make M6 require rarity understanding.

### Boss A Preview

Optional preview only:

```text
Boss 首通奖励: 紫装
```

Purpose:

Create future desire for purple as milestone reward, not teach purple optimization yet.

Risk:

If purple appears too exciting before blue is understood, it may pull attention away from character proof. Keep it in preview only, or defer to next heartbeat.

## Lock-Key Chain With Rarity

Rarity is not a lock or key yet. It is a signal layer on top of existing keys.

```text
Prison A lock:
  failed because power is low.

Camp A key:
  gives equipment power.

Rarity signal:
  explains why Camp A equipment has higher expected value than ordinary drops.
```

Bad version to avoid:

```text
Prison A requires a blue item because blue is blue.
```

Good version:

```text
Camp A is worth doing because it visibly offers higher-quality rewards.
Those rewards often create enough power to retry Prison A.
```

## Failure Memories

### Prison A

No change from V1.1 except attribution can become more specific after Camp A:

```text
Before Camp A:
  primary attribution: 战力不足
  secondary: 装备还不够

After Camp A:
  if power rises >=30%:
    wake Prison A retry
    knowledge update: higher-quality equipment can solve a remembered lock
```

### M6 Process Wall

If the player fails M6 after seeing blue rewards:

```text
primary attribution:
  - if not using rescued character: maybe try the new character
  - if using character but low power: need more power/equipment
secondary attribution:
  - better reward quality may help, but do not make rarity the main diagnosis yet
```

## Playtest / Review Feedback

### Agent A: Player Cognition Naturalness

Severity: `serious`

Findings:

- V1.1 is structurally better than V1, but `Prison A` and `Camp A` being equally actionable still creates a behavior-priority risk.
- The player has just learned that equipment raises power, so Camp A is likely to be more naturally chosen than Prison A unless Prison is framed as the main goal and Camp as a preparation clue.
- If the player clears Camp A before failing Prison A, the failure memory is missing and camp becomes a high-value side reward instead of a lock key.
- M5 only teaches weak role knowledge unless the new character changes a visible process metric.

Required fix before fully advancing V2:

```text
M4 should reveal both Prison A and Camp A, but soft-order the player toward Prison first.
Camp A should become strongly highlighted after Prison A failure.
M5 should show a clear process metric changed by the rescued character.
```

### Agent B: Lock-Key / Pacing

Severity: `minor`

Findings:

- V1.1 lock-key structure is valid.
- V2 can add rarity only if rarity remains a reward signal layer.
- Rarity must not become a new lock/key layer and must not introduce affix, optimization, build, or gear-selection complexity.
- M4 can preview a blue item, Camp A can deliver it, and M6 can reinforce it, but M5 must stay focused on character proof.

Allowed V2 condition:

```text
稀有度 = reward quality expectation
not: optimization system
not: hard requirement
not: affix lesson
```

## Macro Judgment

Skill-model problem:

```text
confirmed: static lock-key validity is not cognitive validity.
```

Design problem:

```text
V2 should not fully advance until V1.2 soft-orders M4 toward Prison first.
```

Review-method problem:

```text
none yet; two subagents launched for this pass.
```

## Rollback Decision

Current severe problem estimate:

```text
serious if V2 is layered onto V1.1 without soft-ordering Prison first
```

Current recommendation:

```text
Create V1.2 baseline first.
Then allow V2 rarity only as a narrow reward-quality signal.
```

## Skill Update Decision

Append to `lock-key-cognition.md` after this pass:

```text
Static lock-key validity is not cognitive validity.
A key becomes cognitively meaningful only if the player has seen, anticipated, or failed the corresponding lock before consuming the key.
```

Do not delete previous skill content.

## Next Iteration Suggestion

If V2 passes:

```text
V3 may introduce equipment level as a stronger version of reward-quality knowledge:
  rarity = how special/exciting the reward is
  level = base stat strength / raw power floor
```

If V2 fails:

```text
Keep rarity invisible until after M6, and use only reward preview text such as "better equipment" rather than color labels.
```

Merged decision:

```text
V2 is conditionally accepted only after V1.2.
Do not advance the live design past V1.2 until the M4 soft-order and M5 process metric are validated.
```
