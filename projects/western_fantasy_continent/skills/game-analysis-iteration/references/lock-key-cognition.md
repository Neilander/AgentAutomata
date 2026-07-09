# Lock-Key Cognition Check

Use this reference when designing or reviewing world-map progression, side branches, prisons, camps, boss gates, tutorial beats, or any sequence where the player must solve a problem before receiving a valuable reward.

Core idea:

```text
Lock-key design is not only a static map structure.
It must be simulated through the player's current cognition:
concepts, knowledge, behaviors, failure memories, attribution, wake-up conditions, and knowledge updates.
```

## 1. Player Cognition Model

Track cognition as:

```text
CognitionState = {
  concepts: Set<Concept>,
  knowledge: KnowledgeRecord[],
  behaviors: Set<Action>,
  failure_memories: FailureMemory[]
}
```

Definitions:

- `concept`: a thing the player knows exists, such as equipment, power, prison, character, camp, field effect, boss, rarity.
- `knowledge`: a relationship the player believes, such as "equipment increases power" or "prison rewards a character".
- `behavior`: an action the player knows they can take, such as challenge level, equip item, farm equipment, challenge prison, change team.
- `failure_memory`: a remembered failure with attribution and wake-up rules.

Do not assume the player can use a concept before the game has introduced it. Do not assume the player can use designer knowledge that is not in `knowledge`.

## 2. Knowledge Records

Knowledge has a first impression and update rules.

Use:

```text
KnowledgeRecord = {
  relation: string,
  first_impression: {
    source_event: string,
    magnitude: number | qualitative,
    wording: string
  },
  current_belief: string,
  update_rules: UpdateRule[]
}
```

Example:

```text
relation: equipment -> power
first_impression:
  source_event: first item after level 1
  magnitude: +10% power
  wording: each item helps a little, and there are many slots
current_belief: equipment gives many small stackable improvements
update_rules:
  if a single equipment action increases power by >=30%, update belief to "equipment can create large jumps"
```

Important rule:

```text
The first impression controls future attribution until a stronger observation updates it.
```

If early equipment gives about `+10%` per item and there are `8` slots, the player learns "equipment gives small stackable gains". If later one item raises power from `100` to `150`, the player should update to "equipment can sometimes create large jumps".

## 3. Action Selection Model

When predicting player behavior, use the player's known behaviors and perceived costs.

Default rule:

```text
If a behavior has never been executed and has no obvious cost, the player tends to try it first.
If a behavior has a cost or risk, the player tries it with low probability unless a failure memory or goal points to it.
If a behavior has produced a useful result before, repeat probability rises when a similar problem appears.
```

This is a modeling rule, not a UI rule. Use it to check whether the map naturally leads the player to the intended action.

## 4. Failure Memory And Attribution

When the player fails, record a failure memory.

Use:

```text
FailureMemory = {
  failed_object: string,
  baseline_state: {
    power?: number,
    team?: string,
    known_concepts: Concept[],
    known_knowledge: string[]
  },
  attribution: {
    primary: string,
    secondary: string[]
  },
  wake_conditions: WakeCondition[],
  retry_probability: string,
  on_retry_fail: string
}
```

Attribution rule:

```text
The player attributes failure only using concepts and knowledge they already have.
```

Example: if the player has not yet learned that new characters can greatly change team power, then failing the first prison should usually be attributed to "power too low", not "I need a different role". The natural response is to farm/equip better gear.

Magnitude rule:

```text
Primary attribution follows the largest known and salient change axis.
Secondary attribution follows smaller or less proven known axes.
```

If the player has learned "equipment gives small stackable power" and later receives a large single-equipment jump, equipment can become a primary attribution for hard locks. If role changes have not yet produced a visible jump, role composition should not be assumed as the player's primary explanation.

## 5. Wake-Up Conditions

A failure memory should have explicit wake-up conditions. Wake-up means the player is likely to retry the failed object.

Initial default for power-attributed failures:

```text
If current_power >= baseline_power * 1.3:
  each action has a chance to wake the failure memory
Probability rises with improvement magnitude
If current_power >= baseline_power * 2.0:
  retry probability reaches 100%
If retry fails:
  refresh baseline_power to current_power
```

Use this as a first-pass model, not a final balance law. Different failure types may need different thresholds:

- ordinary process level: lower wake threshold may be enough;
- prison or side challenge: `+30%` is a reasonable first hypothesis;
- boss or major gate: may require higher power or a specific mechanism/role update.

## 6. Lock, Key, Treasure Definitions

Judge lock/key from the player's cognition, not from designer intent.

```text
Treasure = the valuable thing the player wants or will want after the game introduces it.
Lock = a perceived obstacle that blocks the treasure or blocks progress toward the treasure.
Key = a visible, actionable behavior/resource that the player can believe will solve the lock under current cognition.
```

Common map elements:

- `process level`: often the best early lock because it appears in the main path and creates unavoidable failure/pressure.
- `prison`: often a character key, but only after the player has learned prison rewards characters and that characters matter.
- `camp`: often an equipment key for a prison lock, especially before the player understands role value.
- `boss`: often too late for teaching the first meaning of characters; better as a later synthesis lock.
- `side branch`: can be a key, but should not be the only route if skipping it avoids the intended learning.

Important constraint:

```text
One node can be a key in one relationship and a lock in another relationship.
It should not be both lock and key in the same relationship.
```

Example layered chain:

```text
camp equipment -> unlocks prison
prison character -> unlocks process-level wall
process-level success -> unlocks next map/boss/reward tier
```

## 7. Designing A Lock-Key Cognition Chain

Use this procedure:

1. List all available map elements.
2. For each element, list possible treasure, lock, and key roles.
3. Write the player's cognition before each element appears:
   - known concepts;
   - known knowledge;
   - known behaviors;
   - known failure memories.
4. Place the first lock where the player can feel a problem early enough.
5. Ensure the intended key is visible before or near the lock, but not granted before the player understands the need.
6. If the key has its own challenge, give that challenge its own key.
7. Ensure at least two heterogeneous solutions for important locks.
8. Check wake-up timing: after obtaining a key, will the related failure memory be awakened soon?
9. Check knowledge update: after success, what new knowledge does the player learn?

Heterogeneous solution rule:

```text
An important lock should have at least two different-quality solutions.
Example:
  solution A: clear camp -> equip better gear -> clear prison -> recruit character -> clear wall
  solution B: farm current level/gear enough -> clear wall directly
```

Do not count two versions of the same stat increase as different-quality solutions.

## 8. Review Format

Use this format when reviewing a proposed progression segment:

```text
Segment:
Target treasure:

Before segment cognition:
  concepts:
  knowledge:
  behaviors:
  failure_memories:

Element roles:
  process levels:
  camp:
  prison:
  boss:
  other:

Intended lock:
  node:
  what failure or blocked desire it creates:
  why the player can perceive it:

Intended key:
  node/action:
  why the player can see it:
  why the player believes it helps under current cognition:

Key's own lock, if any:
  node:
  attribution on failure:
  key for this lower lock:

Failure memory:
  failed_object:
  baseline:
  primary attribution:
  secondary attribution:
  wake condition:
  retry probability curve:

Knowledge update on success:
  new concepts:
  new knowledge:
  updated first impressions:
  new behaviors:

Heterogeneous fallback solution:
  fallback:
  why it is different-quality:

Risks:
  key granted before need is felt:
  lock too late:
  intended key not visible:
  attribution uses unknown concept:
  wake-up threshold too high/low:
```

Reject or revise if:

- the player gets the key before they can feel why it matters;
- the lock appears so late that the intended concept is not learned early enough;
- the intended attribution requires a concept the player does not yet know;
- the map relies on the player choosing a costly side action without a failure memory or visible reason;
- the key does not wake the relevant failure memory;
- success does not update the player's knowledge;
- the only fallback is the same solution with bigger numbers.
