# Player Signal Simulation System

## Purpose

This document defines a practical design framework for simulating how a player receives game signals, notices them, and converts them into emotional experience. It is meant to help agents design playable features before implementation and later evaluate whether a prototype is actually readable and satisfying.

The core idea:

> A game does not send "fun" directly. It sends signals. The player notices some of them, ignores others, and emotionally interprets the noticed ones.

Important correction:

> A signal has no fixed emotional meaning outside player intent. The same signal can feel rewarding, irrelevant, or annoying depending on why the player entered the screen.

Example:

- In an equipment screen, a large `power +300` signal can create growth.
- In a puzzle screen, the same large `power +300` signal can break focus because the player's intent is to find the puzzle question or solve elements.
- In a combat recap, `power +300` may be secondary unless the player came in to compare upgrades.

The system has four layers:

1. Intent Model: why the player entered this screen.
2. Signal Emitter: what the game/interface sends.
3. Signal Receiver: what the player notices first and how strongly.
4. Signal Analyzer: how noticed signals become emotions such as growth, danger, mastery, pressure, curiosity, or frustration.

## Layer 0: Intent Model

Before analyzing signals, define the player's screen intent.

Intent answers:

- Why did the player enter this screen?
- What are they trying to find?
- What are they trying to decide?
- What action do they expect to perform next?
- What information would be a distraction right now?

### Intent Object

```js
{
  id: "solve_encounter",
  screen: "encounter_lab",
  playerGoal: "choose a team that can beat this enemy",
  primaryQuestions: [
    "What is the enemy threat?",
    "How many units can I choose?",
    "Which candidates answer this threat?"
  ],
  expectedActions: ["inspect_enemy", "select_units", "start_challenge", "revise_team"],
  desiredEmotions: ["tactical_curiosity", "agency", "challenge", "mastery"],
  forbiddenMainSignals: ["solver_answer", "raw_debug_log", "unrelated_growth_hype"],
  secondarySignals: ["win_rate", "known_passing_combos", "raw_damage_breakdown"]
}
```

### Common Intent Types

| Intent | Player Wants | Strong Signals Should Be | Signals To Suppress |
| --- | --- | --- | --- |
| Solve puzzle | Find clue/question and reason through it | puzzle object, constraints, input affordance | unrelated rewards, noisy combat stats |
| Build team | Compare threats and candidate roles | enemy intent, team slots, role counters | solver answer, raw logs |
| Upgrade character | Find best equipment/skill change | stat delta, equipped state, power change | long lore, hidden solver data |
| Watch combat | Understand action and outcome | movement, hits, skill casts, deaths | inventory detail, backend metrics |
| Claim reward | Feel payoff and collect value | rarity, item identity, growth delta | enemy details, unrelated menus |
| Debug balance | Inspect mechanics and evidence | signals, reports, pass/fail samples | decorative animation, simplified player copy |

The same UI component may need different signal priorities under different intent modes.

## Layer 1: Signal Emitter

Every game screen emits signals. Some are static, some are caused by change.

### Default Screen Signals

When a screen opens, everything visible is a signal:

- buttons
- character cards
- enemy cards
- health bars
- numbers
- skill text
- map objects
- warnings
- rewards
- debug panels

These signals compete for attention. A screen can fail if low-value signals are too loud or high-value signals are too quiet.

### Event Signals

When something changes, a new signal is emitted:

- damage number appears
- equipment power increases
- character enters a team slot
- enemy dies
- shield appears
- rare item drops
- battle starts
- battle ends
- a recommendation appears
- a solver result is exposed

Event signals usually matter more than static signals because motion/change naturally pulls attention.

### Signal Object

Each signal should be represented as structured data:

```js
{
  id: "power_gain_001",
  source: "equipment_panel",
  content: "战力 +128",
  type: "growth",
  target: "selected_character",
  value: 128,
  importance: 0.8,
  intentFit: 1.0,
  visibility: {
    size: 0.7,
    colorContrast: 0.8,
    motion: 0.9,
    duration: 1.2,
    positionPriority: 0.7
  },
  context: {
    playerGoal: "upgrade_character",
    isExpected: true,
    isDebug: false,
    isSpoiler: false
  }
}
```

### Intent Fit

Every signal should include how well it fits the current intent:

```js
{
  type: "growth",
  content: "power +300",
  intentFitByMode: {
    solve_encounter: 0.3,
    upgrade_character: 1.0,
    solve_puzzle: 0.1
  }
}
```

If a signal is visually strong but has low intent fit, it becomes noise or distraction.

## Layer 2: Signal Receiver

The player does not receive all signals equally. The receiver estimates what the player notices and how much attention it gets.

### Visual Priority Factors

For the first version, focus on visual channels:

- Size: bigger elements are noticed first.
- Color contrast: high contrast is noticed first.
- Motion: moving/scaling/flashing elements are noticed first.
- Position: center, near cursor, or near the active game object is stronger.
- Duration: signals that remain long enough are easier to understand.
- Repetition: repeated signals become pattern recognition, but can also become noise.
- Novelty: new or rare signals get more attention.
- Occlusion: overlapped or crowded signals lose priority.

Audio can be added later, but is not required for the first version.

### Attention Score

The receiver does not simply sort signals. It allocates a limited attention budget.

First version:

```js
attentionBudget = 100
```

Attention is allocated through a recursive node tree:

1. Analyze the page hierarchy.
2. Split screen attention across top-level regions.
3. Split each region's attention across its child regions.
4. Continue until leaf signals.

This matters because players usually do not read a screen as independent atoms. They first notice regions, then subregions, then specific controls or signals.

The previous two-level model is only a special case:

```text
screen -> cluster -> signal
```

The general model is:

```text
screen -> region -> panel -> list -> card -> text/icon/button
```

Examples:

```text
screen
  battle_area
    scorebar
    battlefield
      left_units
      right_units
      skill_effects
    legend
  preset_dock
    left_preset_list
      poison_bloom_card
      fire_burst_card
      selected_card
    right_preset_list
      iron_wall_card
      shadow_execute_card
  config_panels
    left_config
    right_config
```

### Attention Node

Each analyzed element is an attention node:

```js
{
  id: "preset_dock",
  label: "Left/right preset selector",
  type: "panel",
  mode: "individual_reading",
  importance: 0.75,
  intentFit: 0.65,
  salience: 0.72,
  goalRelevance: 0.7,
  novelty: 0.45,
  thresholds: { min: 12, ideal: 20, max: 30 },
  childrenComfortLimit: 8,
  children: []
}
```

Every analysis should start by writing the hierarchy tree before computing attention. If the tree is wrong, the attention result will be misleading.

### Signal Raw Strength

Each signal has raw strength:

```js
bottomUpAttention = salience * novelty

topDownAttention = importance * intentFit * goalRelevance

rawStrength =
  bottomUpAttention * bottomUpWeight +
  topDownAttention * topDownWeight
```

Where:

- `importance`: how important the game event actually is.
- `intentFit`: whether this signal belongs to why the player entered the screen.
- `salience`: visual force from size, color contrast, motion, position, duration.
- `goalRelevance`: whether it relates to the player's current decision.
- `novelty`: whether it is fresh or rare.
- `bottomUpAttention`: involuntary visual pull.
- `topDownAttention`: task-driven relevance.

Suggested first values:

```js
bottomUpWeight = 0.42
topDownWeight = 0.58
```

Do not multiply all factors into one number. Pure multiplication hides a real problem: visually strong but intent-mismatched signals, such as cookie banners or ads, can still steal attention. The analyzer should notice them first, then judge them as intent mismatch.

Then apply penalties or bonuses:

```js
effectiveStrength =
  rawStrength *
  categoryPenalty *
  clusterPenalty *
  clarityPenalty
```

Where:

- `categoryPenalty`: similar signals dilute each other.
- `clusterPenalty`: crowded or overlapping clusters make individual signals harder to read.
- `clarityPenalty`: penalty for too much text, unclear wording, debug leakage, or visual ambiguity.

### Category Penalty

Similar signals compete strongly with each other.

Example:

- One large damage number is clear.
- Ten same-color damage numbers become a cloud.
- Ten identical tags on ten cards become texture, not ten separate messages.

Formula:

```js
categoryPenalty = 1 / sameCategoryCount ^ categoryDilution
```

Suggested first values:

```js
categoryDilution = 0.6
```

Do not use this blindly. If the design goal is mass feeling, similar signals can become a gestalt bonus instead of a penalty.

### Attention Nodes And Clusters

Every signal belongs to a cluster.

Example clusters:

- `topbar`
- `level_strip`
- `enemy_brief`
- `current_squad`
- `battlefield`
- `candidate_roster`
- `result_panel`
- `debug_panel`
- `reward_burst`
- `floating_numbers`

Cluster object:

```js
{
  id: "candidate_roster",
  intentRole: "choose_units",
  mode: "individual_reading",
  areaShare: 0.22,
  minAttention: 18,
  idealAttention: 28,
  maxIdealAttention: 36,
  maxComfortSignals: 8
}
```

Cluster modes:

- `individual_reading`: player must distinguish each signal, such as hero cards, equipment affixes, puzzle clues.
- `gestalt_feedback`: player only needs an overall feeling, such as coin burst, AOE hit numbers, fire spread.

In the recursive model, any node with children can behave like a cluster.

### Cluster Penalty

Cluster penalty models local crowding.

```js
clusterPenalty =
  densityPenalty *
  overlapPenalty *
  similarityPenalty
```

Density penalty:

```js
density = signalCount / clusterArea
densityPenalty = 1 / (1 + density * densityWeight)
```

Overlap penalty:

```js
overlapPenalty = 1 - overlapRatio
```

Similarity penalty:

```js
similarityPenalty = 1 / sameVisualGroupCount ^ visualSimilarityDilution
```

Suggested first values:

```js
densityWeight = 0.08
visualSimilarityDilution = 0.5
```

If cluster mode is `gestalt_feedback`, use a lighter penalty and optionally add mass bonus:

```js
massSignalBonus = log(1 + signalCount)
```

This means:

- A crowded equipment list is bad because the player must read each item.
- A crowded coin burst can be good because the player only needs to feel "many rewards".

### Recursive Attention Allocation

First compute every node's own strength:

```js
bottomUpAttention = salience * novelty

topDownAttention = importance * intentFit * goalRelevance

nodeOwnStrength =
  bottomUpAttention * bottomUpWeight +
  topDownAttention * topDownWeight
```

Then compute child-adjusted node strength:

```js
nodeStrength =
  nodeOwnStrength *
  categoryPenalty *
  clusterPenalty *
  clarityPenalty
```

Then allocate parent attention to children:

```js
childAttention_i =
  parentAttention *
  childStrength_i ^ attentionPower /
  sum(siblingStrength_all ^ attentionPower)
```

Suggested first value:

```js
attentionPower = 1.5
```

Then recurse:

```js
allocateAttention(child)
```

Important rule:

> Category dilution, similarity dilution, and density pressure should be computed among siblings under the same parent, not globally across the entire screen.

This prevents unrelated elements from diluting each other. Preset cards compete with preset cards. They do not directly compete with battlefield health bars as same-category siblings.

### Z-Layer And Overlay Attention

Some UI nodes are visually above other nodes:

- dropdown menus
- popovers
- modals
- tooltips
- floating combat numbers
- context menus
- dragged items
- selected item detail overlays

These should receive extra attention because they cover existing screen content and interrupt the normal hierarchy.

Add `zLayer` to attention nodes:

```js
{
  id: "left_preset_dropdown",
  type: "dropdown_menu",
  zLayer: 3,
  coversArea: 0.18,
  children: []
}
```

Suggested layer meaning:

```text
0: normal page content
1: sticky/fixed HUD
2: dropdown/popover/tooltip
3: modal or blocking overlay
4: urgent blocking alert
```

Overlay strength modifier:

```js
zLayerBonus = 1 + zLayer * 0.18
coverPenaltyToBelow = coversArea * 0.6
```

Interpretation:

- A dropdown is not just another list. It temporarily becomes the active choice surface.
- Covered nodes should lose attention while the overlay is open.
- The analyzer should evaluate both closed and open states for dynamic controls.

This matters for controls such as dropdown menus. A closed dropdown compresses many choices into one low-area control. An open dropdown temporarily expands into an overlay and should receive much more attention than normal background content.

### Child Readability

Parent attention can look acceptable while children remain unreadable.

Example:

```text
preset_list attention = 12
children = 14 preset cards
average card attention = 0.7
selected card attention = 2.1
```

The list may be visible as a region, but individual cards are not readable enough.

Each node can define:

- `minAttention`
- `idealAttention`
- `maxIdealAttention`
- `childrenComfortLimit`
- `minChildAttention`

The analyzer should report both:

- node-level visibility
- child-level readability

The Matthew powers create head-heavy attention:

- `1.0`: nearly proportional.
- `1.5`: clear head signals win.
- `2.0`: one or two signals dominate.
- `>2.0`: risky; other signals may disappear.

### Module Attention Thresholds

Each important module defines:

```js
{
  minAttention: 12,
  idealAttention: 22,
  maxIdealAttention: 34
}
```

Interpretation:

- Below `minAttention`: player probably misses or misunderstands it.
- Around `idealAttention`: good.
- Above `maxIdealAttention`: it may suppress other important modules.

Example for encounter lab under `build_team` intent:

```js
{
  enemy_threat: { min: 18, ideal: 28, max: 36 },
  current_squad: { min: 16, ideal: 24, max: 32 },
  start_button: { min: 10, ideal: 16, max: 24 },
  candidate_roster: { min: 18, ideal: 28, max: 38 },
  solver_debug: { min: 0, ideal: 4, max: 8 }
}
```

If `solver_debug` receives 20 attention in player mode, the interface is leaking debug information into the main experience.

### Receiver Output

The receiver should output:

```js
{
  topClusters: [
    { id: "enemy_brief", attention: 27, status: "ok" },
    { id: "candidate_roster", attention: 25, status: "ok" },
    { id: "debug_panel", attention: 18, status: "too_high" }
  ],
  topSignals: [
    { id: "enemy_boss_card", attention: 12, emotionCandidate: "pressure" },
    { id: "solver_answer", attention: 10, emotionCandidate: "agency_loss" }
  ],
  issues: [
    "debug_panel exceeds max attention for player mode",
    "current_squad below minimum attention",
    "candidate_roster has 12 individual-reading signals; comfort limit is 8"
  ]
}
```

### Signal Multiplier

A signal feels strong when both sides are high:

- The event is important.
- The presentation makes it visible.
- The signal matches the player's current intent.

Examples:

- Big power jump + strong animation = strong growth feeling.
- Tiny irrelevant stat + huge animation = fake hype.
- Important rare drop + tiny text = missed reward.
- Debug solver result + big main panel = wrong signal hierarchy.
- Big upgrade number in puzzle mode = distracting intent mismatch.

## Layer 3: Signal Analyzer

The analyzer converts received signals into player emotions.

### Initial Emotion Mapping

| Signal Pattern | Possible Emotional Interpretation |
| --- | --- |
| Stat increase, power increase, new equipment | Growth |
| Enemy threat, low HP, countdown | Pressure |
| Correct counter-choice succeeds | Mastery |
| Unknown enemy skill, locked content | Curiosity |
| Rare drop, new character, high rarity glow | Reward |
| Repeated failure with clear reason | Challenge |
| Repeated failure without readable reason | Frustration |
| Many choices with no guidance | Confusion |
| Big animation for minor value | Distrust |
| Debug answer shown before player choice | Agency loss |

### Threshold Drift

Growth signals raise expectations over time. If the player sees frequent power gains, the emotional threshold for future gains increases.

Example:

- First +50 power: exciting.
- After many +500 gains: +50 becomes noise.

This needs a player-memory model:

```js
playerMemory = {
  recentGrowthBaseline: 350,
  rareRewardBaseline: "epic",
  expectedBattleFeedbackDensity: 0.6,
  toleranceForFailureWithoutReason: 2
}
```

Threshold drift should be designed later; for now, record it as a required extension.

## Player Simulation Loop

For each screen or feature:

1. Define the player's entry intent.
2. Define the player goal.
3. Collect emitted static signals.
4. Simulate which signals the receiver notices first.
5. Trigger player action.
6. Collect event signals after the action.
7. Convert received signals into emotions.
8. Evaluate whether the emotion matches the design goal.

Example for encounter lab:

```text
Goal: choose a team to beat the current enemy.
Expected emotion: tactical curiosity -> agency -> challenge -> mastery.

Bad signal flow:
solver answer is visible before player chooses
=> receiver notices answer
=> analyzer produces agency loss

Good signal flow:
enemy threat is visible first
team slots and candidate roles are visible second
challenge result appears after player choice
=> analyzer produces agency and mastery/challenge
```

## Design-Time Agent Workflow

Before implementing a feature, an agent must answer:

1. What is the player's entry intent?
2. What is the player's current goal?
3. What information must the player receive to act?
4. What information must be hidden, delayed, or folded into debug mode?
5. What signals should be strongest under this intent?
6. What emotion should those signals produce?
7. What player action should happen next?
8. What feedback proves the action mattered?

If the agent cannot answer these, it should not start UI implementation yet.

## How To Use This For Interface Design

This system is useful because it creates a bridge from abstract design request to concrete UI layout.

### Step 1: Convert Requirement To Intent

User request:

> Make a dungeon encounter screen where the player chooses a team to beat fixed enemies.

Intent:

```text
The player wants to understand the enemy threat, pick a small team from candidates, run the fight, and revise if they fail.
```

### Step 2: Derive Required Information

For that intent, required information is:

- current level
- enemy identity and threat tags
- choose count
- candidate roles and key skills
- current selected team
- start challenge button
- result and basic reason

Optional or debug information:

- all passing combos
- fail samples
- solver seed
- full damage table

### Step 3: Assign Information Priority

```text
P0: enemy threat, selected team, challenge action
P1: candidates and role tags
P2: battle preview and result summary
P3: known winning/failing combos
P4: raw debug data
```

### Step 4: Choose Visual Signal Strength

Make P0 large, central, and persistent.

Make P1 selectable and scannable.

Make P2 appear after action.

Make P3 folded behind debug controls.

Never let P3 or P4 visually dominate P0.

### Step 5: Build Agent Player Checks

After implementation, the agent player should verify:

- The first strong signal matches the entry intent.
- The player can identify the next action without reading long text.
- The page does not reveal forbidden main signals.
- Important feedback appears after action, not before.
- The result connects back to the player's choice.

### Step 6: Iterate By Signal Mismatch

If the page feels wrong, do not start by changing colors. First ask:

- Did the wrong signal become strongest?
- Did the strongest signal mismatch intent?
- Did a required signal fail to appear?
- Did the page reveal a signal that should be hidden?
- Did the player action produce insufficient feedback?

### Control Choice After Attention Diagnosis

The signal system can detect that a region has too many same-level signals, but interface design must choose the control that solves it.

When a region lacks enough attention or has too many competing children, consider replacing a flat display with a control:

| Problem | Possible Control | Why |
| --- | --- | --- |
| Many options, only one current value matters | Dropdown | Compresses inactive options; open state becomes temporary overlay |
| Few mutually exclusive modes | Segmented control | Keeps choices visible without list clutter |
| Many objects need icon scanning | Grid | Supports visual search and state badges |
| Many objects need comparison | Card list plus selected detail | Reduces repeated text while preserving comparison |
| Secondary info useful but not current | Collapsible panel | Keeps debug/detail out of main attention budget |
| Exact item hard to find | Search/filter | Reduces option set before attention allocation |
| Numeric continuous value | Slider/stepper | Shows range and current value clearly |

Dropdown rule:

> Use a dropdown when there are many options, the player mainly needs the selected value, and non-selected options should not constantly compete for attention.

Do not use a dropdown when the player must compare many options visually at the same time. In that case, use a grid, list with selected detail, filters, or tabs.

Dynamic controls must be analyzed in two states:

1. Closed state: compact control, low area, selected value visible.
2. Open state: overlay list, high z-layer, temporarily dominates attention and covers lower content.

## Validation Signals

The prototype should log signals that allow an agent player to judge experience:

- `screen_opened`
- `primary_goal_visible`
- `enemy_threat_visible`
- `choice_available`
- `choice_made`
- `debug_signal_visible`
- `spoiler_signal_visible`
- `battle_started`
- `combat_event_visible`
- `result_visible`
- `failure_reason_visible`
- `reward_visible`
- `growth_signal_visible`

These logs do not replace real UI review, but they let agents detect common failures.

## Failure Modes

### Debug Leakage

The page shows internal solver data, raw reports, or optimal answers as main-player information.

Effect:

- agency loss
- confusion
- reduced motivation to experiment

### Fake Importance

Small or irrelevant changes get huge visual treatment.

Effect:

- distrust
- noise fatigue

### Missed Reward

Important reward or growth signal is visually weak.

Effect:

- low satisfaction
- player does not feel progress

### No Action-Feedback Link

The player clicks or chooses something, but the result does not clearly connect to that action.

Effect:

- loss of mastery
- result feels random or meaningless

### Result Without Process

The system jumps directly from choice to pass/fail with no readable battle or transition.

Effect:

- low tension
- low payoff
- weak learning

## Open Questions To Refine

1. Intent taxonomy:
   - What are the standard intents in this project?
   - Examples: solve, build, upgrade, watch, collect, recruit, debug.
   - Can a screen support multiple intents without becoming noisy?

2. Emotion taxonomy:
   - Which emotions matter most for this project?
   - Growth, mastery, danger, curiosity, reward, pressure, surprise, frustration, agency?

3. Signal scoring formula:
   - What weights should size, color, motion, and position have?
   - Should weights differ by screen type?

4. Player memory:
   - How long should recent reward/growth baselines persist?
   - How should threshold drift be modeled?

5. Signal saturation:
   - How many simultaneous high-priority signals can a player process?
   - When does feedback become clutter?

6. Debug visibility rules:
   - Which screens can show solver data by default?
   - Which screens must hide it behind debug mode?

7. Agent player model:
   - Should there be multiple simulated player types?
   - Example: optimizer, casual player, collector, impatient player.

8. Validation threshold:
   - What score means a feature is playable enough?
   - Which failures are hard blockers?

9. Tooling:
   - Should UI components explicitly emit signal metadata?
   - Should an overlay show signal priority during development?

## Critique Of This System

This framework is useful, but it has several risks.

### Risk 1: It Can Become Too Abstract

If agents only write intent/emotion documents and never connect them to concrete layout rules, it becomes design theater.

Mitigation:

- Always force output into information priority and UI placement.
- Require a before/after signal mismatch explanation when changing a screen.

### Risk 2: Signal Scores Can Become Fake Precision

Weights like `0.7 size` or `0.8 color` may look scientific without being validated.

Mitigation:

- Use coarse levels first: low, medium, high.
- Only add numeric scoring after several real examples.

### Risk 3: Intent Can Be Mixed

Some screens naturally support multiple intents. For example, a character screen may support upgrade, compare, equip, and inspect.

Mitigation:

- Pick one primary intent per screen state.
- Use tabs or modes when intents conflict.
- Do not let all intents compete in one flat layout.

### Risk 4: Agent Player May Overfit To Rules

An agent can pass checklist-style signal tests while still producing a dull screen.

Mitigation:

- Combine rule checks with visual review.
- Add human-visible screenshots and short player-path summaries.
- Track whether the screen creates a reason to continue.

### Risk 5: Emotional Interpretation Is Contextual

Growth, reward, and mastery depend on player history. A signal that works once may not work after repetition.

Mitigation:

- Keep player-memory and threshold drift as first-class future work.
- Do not claim emotion accuracy from a single static screen.

## First Practical Version

The first implementation should stay simple:

1. Define signal JSON shape.
2. Add manual signal emission to one page, such as encounter lab.
3. Build a small analyzer that lists:
   - strongest visible signals
   - hidden/missed important signals
   - debug leakage
   - likely emotion output
4. Use the report before and after UI changes.

The system should not try to simulate a whole human immediately. It should first catch the obvious failures that agents often miss.

## Validation Plan For Attention Fitting

The attention receiver is only useful if its output roughly matches what a player or reviewer actually notices. Validation should happen in small steps.

### 1. Golden-Screen Manual Labels

Create a small set of reference screens:

- good encounter selection screen
- bad solver-leak encounter screen
- crowded inventory screen
- clean inventory screen
- combat with readable skill feedback
- combat with noisy unreadable floaters
- puzzle screen with correct clue focus
- puzzle screen with unrelated reward noise

For each screen, a human writes:

```text
First noticed:
1. enemy boss card
2. team slots
3. start challenge button

Should notice:
1. enemy boss card
2. team slots
3. candidate roles

Should not dominate:
1. solver answer
2. raw debug report
```

The receiver passes if its top clusters/signals are close to the human label.

### 2. Rank Correlation Check

Compare predicted top signals with human top signals.

Use a rough metric first:

```text
top3Overlap = predictedTop3 ∩ humanTop3
```

Acceptance:

- 2/3 overlap: usable.
- 3/3 overlap: good.
- 0/3 or 1/3: inspect formula or signal metadata.

Later, use Spearman rank correlation if numeric labels become stable.

### 3. Intent Mismatch Tests

Use the same screen signals under different intents.

Example:

- `upgrade_character`: power gain should rank high.
- `solve_puzzle`: power gain should rank low.
- `debug_balance`: raw signal report can rank high.
- `build_team`: raw signal report should rank low.

The model passes if the top signals change when intent changes.

This is important because the system should not encode "big number always good".

### 4. Crowding Perturbation Tests

Take one screen and add repeated signals:

- 1 damage number
- 3 damage numbers
- 10 damage numbers
- 20 damage numbers

Expected:

- Single signal gets high individual attention.
- Many signals become lower individual attention.
- If mode is `gestalt_feedback`, cluster can still get strong overall attention.
- If mode is `individual_reading`, readability should fail.

This validates category penalty and cluster penalty.

### 5. Debug Leakage Tests

Create two versions of the same player screen:

- Version A: solver/debug panel collapsed.
- Version B: solver/debug answer visible as a main panel.

Expected:

- Version A: debug cluster attention below max.
- Version B: debug cluster attention exceeds max and reports agency-loss risk.

This directly validates the failure seen in encounter lab.

### 6. Before/After Real Case Test

Use the actual encounter lab before and after the redesign.

Expected before:

- solver/debug signals rank too high.
- player action path is weak.
- current intent is polluted by answer leakage.

Expected after:

- enemy threat, current squad, and candidate roster rank higher.
- solver/debug falls into low attention unless expanded.
- start challenge remains visible enough.

This test is more valuable than synthetic examples because it matches the real agent failure.

### 7. Human Review Disagreement Log

Whenever the model disagrees with the user or human reviewer, record:

```text
screen:
intent:
model top signals:
human top signals:
disagreement:
possible cause:
formula/metadata adjustment:
```

The goal is not to prove the formula is right. The goal is to turn failures into better metadata and better weights.

### 8. Acceptance Criteria For First Version

The first version is acceptable if:

- It catches debug leakage in player-facing screens.
- It catches important modules below minimum attention.
- It catches crowded individual-reading clusters.
- It changes rankings when intent changes.
- It gives useful UI recommendations at least 70% of the time on the first golden-screen set.

It is not expected to perfectly predict emotion yet.

### 9. What Not To Validate Yet

Do not validate these in the first version:

- exact emotional intensity
- long-term player memory
- audio attention
- full fun prediction
- exact numeric thresholds

These require more examples and real user observation.
