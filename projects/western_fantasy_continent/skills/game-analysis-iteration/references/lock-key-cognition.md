# Lock-Key Cognition Check

> The general player cognition and experience model now lives in `../../player-cognition-simulation/SKILL.md`. Use that skill for new cognition-state, effort-rhythm, learned-expectation, emotion, and abandonment work. The overlapping sections below remain as the validated historical baseline; apply this file specifically to lock, key, treasure, bypass, and map-order questions.

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

### Smart-But-Knowledge-Bounded Player Agent

When a subagent or script playtests a progression loop, do not model the player as a fixed route executor. Model a player that is smart, but only inside the concepts, knowledge, behaviors, and memories the game has already taught.

Use this behavior loop:

```text
observe current goal and visible choices
choose the lowest-cost known behavior that plausibly advances the goal
run the real combat / real system result
if success:
  record the action as useful
  update knowledge from visible reward and combat outcome
if failure:
  record a failure memory with attribution using only known concepts
  choose the next known behavior with a different explanation axis
  retry only when the wake condition is met
```

Required escalation examples:

- If the player fails once and already knows `equipment -> power`, the next likely behavior is farm/equip, not team redesign.
- If the player fails after visible equipment changes, update the memory to `equipment tried but insufficient`; then role/team changes can become plausible if the player knows characters or roles matter.
- If the player has not learned role value yet, do not assume they will solve a wall by optimizing composition.
- If the player has learned a field effect or enemy structure, they may switch to a team that visibly answers that structure.

This rule matters for automation:

```text
Do not let a test agent use designer knowledge before the game teaches it.
Do not let a test agent repeat the same failed action without a new wake condition.
Do not mark a progression chain valid unless the player's next behavior follows from visible knowledge.
```

### Player-Agent Validation Contract

Player-agent simulation is only valid when its observation and action space match the playable page.

Required parity checks:

```text
observation parity:
  every fact given to the agent must be visible or inferable in the real UI

action parity:
  every behavior listed in cognition must have a real executable action

system parity:
  battles, drops, equipment changes, and unlocks must use the real runtime rules

memory parity:
  the agent may remember observed events, but not hidden designer intent
```

Examples of invalid optimistic simulation:

- the agent sees exact equipment-slot strength while the page only shows a total number;
- cognition says `change team`, but the page has no team-change action;
- the agent receives an explicit current goal that the actual page never communicates;
- the report calls a battle a role proof without a contribution signal or comparison the player can perceive;
- the test enemy has disabled skills while the design report describes it as a full enemy team.

Run at least two different bounded player policies for important teaching segments:

```text
goal-driven player:
  prefers new visible goals and avoids purposeless farming

cautious loot player:
  farms for a concrete weak slot or after a recorded failure,
  but stops after repeated no-improvement results
```

Record for each run:

- number of real decision points (`available actions > 1`);
- first failure and the concepts available for attribution;
- state change that woke each retry;
- whether the intended key was used;
- whether the player bypassed the teaching lock;
- whether a bypass permanently hid or invalidated later content.

Important interpretation rule:

```text
If two agents follow the same route because every step has only one action,
the test validates scripting, not cognition.
```

For probabilistic combat locks, batch-test bypass rate in addition to individual playthroughs. A successful bypass can be valid, but the bypass route must remain coherent: optional keys must not stay permanently locked, goals must update correctly, and later teaching cannot assume the missed failure occurred.

### Optional Branch Contract

An optional branch creates combat friction, not map permission.

```text
optional branch:
  may offer a strong key, character, or shortcut;
  must not block mainline traversal;
  must remain challengeable after failure and after first clear;
  may grant its unique/core treasure only on first clear;
  must leave a coherent bypass route for players who ignore it.
```

Do not judge bypass as an automatic design failure. Test the bypass as its own player route. Reject the structure only when later content assumes the player learned or collected something from a branch they were allowed to skip.

### Runtime Character-Key Contract

Before using a character as a key, inspect the running combat contract rather than the class name or fantasy text:

```text
targeting rule -> actual skill targets -> output/survival contribution -> visible combat signal
```

Confirm all four in code or telemetry. Never claim a character attacks the backline, breaks shields, protects allies, or controls an area unless the runtime actually does it. Build the lock around the capability that exists; if a new capability is needed, add it as explicit new content instead of silently rewriting the established character.

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

Timing constraint:

```text
Static lock-key validity is not enough.
A key is cognitively meaningful only if the player has seen, anticipated, or failed the corresponding lock before consuming the key.
If a key is consumed first, it is likely learned as a generic reward rather than as a solution.
```

When a lock and its key appear together, check salience and action order:

```text
The lock/treasure should usually be the main desire point.
The key should read as preparation, support, or response.
If the key uses a known concept and the lock uses a new concept, players may naturally choose the key first unless the lock is visually or procedurally prioritized.
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

## 9. Bypass Hardening Notes

Append-only rule added after the first map-lab implementation review:

```text
For the first teaching instance of a new lock-key relationship,
soft salience may be insufficient if the bypass uses already-known concepts.
```

When reviewing an intended lock, check not only the intended key, but also:

```text
mainline continuation:
  Can the player keep doing the already-known default action and skip the lock?

known-reward bypass:
  Can the player consume a visible key or side reward before the failure memory exists,
  especially when that key uses a known concept like equipment -> power?
```

If the intended lock teaches a new concept and the bypass uses a known reward axis, prefer:

```text
preview-only keys until first failure;
temporary mainline pause;
auto-action stop on the first failure moment;
explicit focus on the new lock/treasure before the key is consumed.
```

Do not let automation compress:

```text
failure -> key consumption -> retry success
```

into one unreadable burst. The player must be able to perceive the failure memory moment.

## 10. Feedback Stock, Event Intensity, And Abandonment

Append-only model added after the first playable wave-combat feedback pass.

The player agent must model not only what the player knows and chooses, but whether the game produces enough wanted state change over simulated real game time. Apply this model to combat and world-map decisions.

### State

```text
FeedbackState = {
  value: number,                    // normalized to [0, max_value]
  max_value: number,
  game_time: seconds,
  last_decay_time: seconds,
  decay_per_5s: number,             // higher means a stricter player
  event_records: Map<EventKey, EventRecord>,
  local_failures: Map<FailedObject, number>,
  total_failures: number,
  abandoned: boolean
}

EventRecord = {
  trigger_count: number,
  base_intensity: number,
  freshness: number,                // [0, 1], starts at 1
  last_trigger_time: seconds,
  total_feedback_granted: number
}
```

Keep this beside `concepts`, `knowledge`, `behaviors`, and `failure_memories`. Cognition explains what the player wants and how failure is attributed. Feedback state measures whether those events remain rewarding enough to sustain play.

### Real-Time Decay

AI execution speed is irrelevant. Use elapsed in-game time from the real system or combat result.

```text
decay_ticks = floor((current_game_time - last_decay_time) / 5)
feedback.value = max(0, feedback.value - decay_ticks * decay_per_5s)
last_decay_time += decay_ticks * 5
```

Process decay and events chronologically. A 30-second battle incurs about six decay ticks even if the agent computes the result instantly.

```text
higher decay_per_5s = stricter player who needs more frequent or stronger feedback
lower decay_per_5s = more tolerant player
```

Do not settle one universal strictness yet. Run several values and fit them against human feedback.

### Perceivable Feedback Events

Grant feedback only for a player-perceivable state change. Include combat and world-map events:

```text
combat:
  kill:normal_enemy
  kill:elite_enemy
  cast:<perceived_skill>
  survive:danger_window

progression:
  loot:equipment
  loot:rare_equipment
  equip:power_upgrade
  clear:level
  unlock:character

world/map decisions:
  discover:node_family
  decision:first_main_route
  decision:side_branch
  decision:retry_after_failure
  decision:change_team
  unlock:region
```

Event keys are perception categories, not arbitrary implementation IDs. Similar normal-monster deaths share a key. A visibly distinct elite kill may use another key. Do not split keys merely to evade habituation.

Each event family tracks repetition independently. Repeated normal kills reduce normal-kill feedback but do not reduce equipment-drop or map-decision feedback.

### Linear Habituation

For each event trigger:

```text
event_gain = base_intensity
           * current_desire_multiplier(state, event_key)
           * freshness

feedback.value = min(max_value, feedback.value + event_gain)
trigger_count += 1
freshness = max(0, freshness - 0.10)
```

First hypothesis:

```text
first trigger: 100% freshness
second trigger: 90%
...
tenth trigger: 10%
later triggers: 0% until relevance is restored
```

Do not merge simultaneous events. A skill cast that kills an enemy may grant both `cast:<skill>` and `kill:normal_enemy`, because the player perceived two state changes.

### Base Intensity And Current Desire

Separate stable event importance from temporary need:

```text
base_intensity:
  ordinary feedback strength of an event family

current_desire_multiplier:
  how much the player currently wants the event under the known goal,
  inventory state, failure attribution, first impressions, and available actions
```

An initial ordering may be:

```text
normal enemy kill < ordinary skill cast < useful equipment < character unlock
```

This is not a fixed global ranking. Equipment desire falls when slots are filled, drops stop improving the team, or the player no longer attributes the problem to equipment. A rare label without a perceived upgrade does not automatically grant full equipment feedback.

Use only known cognition when calculating desire. If the player does not know a stat, role, rarity, or field effect matters, do not award extra desire for its hidden designer value.

### Failure Recovery

Failure can make exhausted actions relevant again, but only through current attribution.

On failure of object `g`:

```text
local_failures[g] += 1
total_failures += 1

related_events = events that plausibly answer g under the player's current
                 concepts, knowledge, attribution, and available behaviors

for each related event e:
  event_records[e].freshness = min(1, event_records[e].freshness + recovery_per_failure)

initial recovery_per_failure = 0.40
```

`0.40` means forty percentage points. Preserve `trigger_count` for analysis; recover current freshness instead of erasing history. Multiple relevant failures can accumulate recovery up to `1.0`.

Example:

```text
normal-kill freshness = 0
player fails a power-attributed process level
farming normal enemies is a known route to power or equipment
normal-kill freshness becomes 0.40
```

An unrelated failure must not restore every event. The attribution graph decides what becomes wanted again.

### Abandonment Check

Check abandonment at each failure. Probability rises with cumulative failure and falls with feedback stock at the failure moment.

```text
feedback_ratio = feedback.value / feedback.max_value

abandon_logit = base_abandon_bias
              + local_failure_weight * local_failures[failed_object]
              + total_failure_weight * total_failures
              - feedback_protection_weight * feedback_ratio

abandon_probability = sigmoid(abandon_logit)
```

Use a seeded roll in automated playtests. Keep all coefficients configurable.

Evaluation order:

```text
1. advance the real-time feedback clock to the failure timestamp;
2. record failure counts;
3. calculate abandonment from feedback at that moment;
4. if the player continues, restore related event freshness by at least 0.40;
5. update failure memory and choose the next behavior.
```

Future feedback restored by failure does not protect the player from abandoning at the same failure. It represents renewed motivation after deciding to continue.

Failure is not automatically positive feedback. Count a consolation reward, knowledge reveal, or near-miss signal only if the real game visibly presents it.

### Player-Agent Execution Contract

Every simulated action returns a real-time event trace:

```text
ActionResult = {
  duration_seconds: number,
  events: [{ time_offset, event_key, visible_magnitude?, metadata? }],
  outcome: success | failure | retreat,
  failed_object?: string
}
```

Process:

```text
for action in player_route:
  run the real system/combat
  sort visible events by time_offset
  advance decay to each event timestamp
  grant event feedback
  advance decay to action end
  include visible world/map decision and unlock events
  if failure:
    run abandonment check
    if not abandoned:
      restore related event freshness
      update failure memory and continue cognition loop
```

If runtime signals do not expose event timing, record that as a validation limitation. Never collapse an entire battle into time zero or award all kill feedback at battle completion.

### Required Trace And Diagnostics

For each decay, event, and failure, record:

```text
game_time
feedback_before
decay_amount
event_key
event_trigger_count
base_intensity
desire_multiplier
freshness_before
feedback_gain
feedback_after
failed_object
local_failure_count
abandon_probability
abandon_roll
```

Review at least:

- longest interval without positive feedback;
- time spent at zero or below a low-feedback threshold;
- feedback contribution by combat, progression, and world-decision families;
- event families exhausted before an encounter ends;
- feedback at each failure and abandonment probability by failure count;
- whether the intended key creates wanted feedback before abandonment;
- whether adding more enemies only adds zero-freshness repetition;
- whether a map choice changes expected feedback rather than only changing labels.

Use this model when a segment is described as `too long`, `boring`, `not rewarding`, `easy but tiring`, or when a lock-key route may be cognitively valid but emotionally flat. Win rate and duration alone cannot validate those complaints.

### Forward-Tested Corrections

Append-only corrections accepted after V1-V4 player/reviewer loops:

```text
feedback stock != freshness != fatigue != frustration != expectation != abandonment
```

Keep them separate:

- `feedback stock`: current positive-feedback reserve after real-time decay and event gains;
- `freshness`: per-event-family repetition multiplier;
- `fatigue`: sustained low-feedback time, long no-positive-feedback intervals, and low recent event diversity;
- `frustration`: active unresolved failure pressure;
- `expectation`: a visible promised possibility plus later fulfilled/missed resolution;
- `abandonment`: a stochastic decision checked at failure, not an emotion label.

Do not derive emotion from feedback stock alone. At minimum, expose:

```text
current_low_feedback_seconds
max_low_feedback_streak
longest_no_positive_interval
recent_positive_event_diversity
active_failure_count
```

A player can be fatigued while feedback stock is still moderate. Conversely, a brief low stock should not automatically mean fatigue.

Failure recovery must be attribution-bounded:

```text
power/equipment attribution may restore:
  normal-kill farming
  main-clear progress
  equipment drops
  equipment upgrades
  farm-after-failure decisions

do not restore by default:
  every previously seen skill cast
  character unlock
  team-change decisions
  role-proof events
```

Restore a skill/role event only when the player's known attribution specifically points to skill execution or role composition. The first accepted hypothesis remains `+0.40` freshness per relevant failure, capped at `1.0`.

Separate pre-roll emotion from abandonment:

```text
pre_abandon_emotion
abandon_probability
abandon_roll
abandoned
```

Never describe one low-probability seeded abandon as the deterministic route outcome. Batch-test probability before generalizing.

Track visible expectations explicitly:

```text
expectation_created
expectation_fulfilled | expectation_missed
expectation_strength
feedback_delta
```

A `possible rare drop` hint is not a guaranteed reward. A miss may apply a small disappointment cost, especially under low feedback, but must not be treated as a full failure.

Record narrow knowledge created by visible counter relationships. Example:

```text
visible prison shield + named shield-break equipment
-> knowledge: named counter equipment may answer a similar visible obstacle
```

Do not generalize this into hidden designer knowledge about every shield or every encounter.

### Calibration Loop

Use this loop when tuning feedback values, recovery, strictness, or abandonment:

```text
analyze current mechanism/numbers
-> adjust one version
-> run knowledge-bounded player agents and preserve raw cognition/emotion traces
-> pass only raw traces plus model rules to an independent human-plausibility reviewer
-> classify findings as mechanism, parameter, content, or test limitation
-> revise and repeat
```

Keep player and reviewer roles separate. Player agents choose actions from visible observations. Reviewer agents receive the player records after play and must distinguish typical mechanisms from low-probability seeded tails.
