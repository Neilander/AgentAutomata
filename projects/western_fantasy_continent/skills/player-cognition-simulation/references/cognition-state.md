# Cognition State

## Contents

1. State schema
2. Observation and knowledge boundaries
3. First impressions and learning
4. Action selection
5. Failure memory and wake-up
6. Emotion and abandonment separation

## 1. State Schema

Maintain a versioned state after every meaningful action:

```yaml
concepts:
  - id: equipment
    first_seen_at: node_1_reward

knowledge:
  - id: equipment_increases_power
    confidence: 0.75
    evidence_count: 1
    first_impression: one_item_small_gain

behaviors:
  - id: equip_item
    discovered: true
    tried: true
    perceived_cost: low

expectations:
  - context: first_region_main_fight
    expected_process: low
    expected_exchange_rate: high
    source: first_enemy_died_in_one_hit

performance_baselines:
  - context: ordinary_enemy/direct_damage
    d50: 100
    d90: 180
    hit_frequency: 1.2
    relative_impact: 0.1
    confidence: 0.6
    frozen_feedback_exposures_remaining: 0

event_prototypes:
  - family: damage/single/basic/ordinary
    expected_log_magnitude: 4.6
    magnitude_variance: 0.2
    exposure_count: 3
    freshness: 0.7

active_goals:
  - id: kill_faster
    perceived_gap: 0.5
    problem_clarity: 0.8
    path_visibility: 0.6
    best_visible_roi: 0.4
    agency: 0.096

attribution_candidates:
  - cause: equipment_too_weak
    confidence: 0.6
    known_basis: equipment_increases_power
  - cause: wrong_character
    confidence: 0.3
    known_basis: character_swap_can_change_results
  - cause: bad_position
    confidence: 0.1
    known_basis: position_is_available_but_unproven

available_behaviors:
  - id: equip_upgrade
    available: true
    believed_causes_addressed: [equipment_too_weak]
  - id: swap_character
    available: true
    believed_causes_addressed: [wrong_character]
  - id: change_position
    available: true
    believed_causes_addressed: [bad_position]

active_hypotheses:
  - id: equip_damage_weapon
    trigger: failed_prison
    problem: enemies_survive_too_long
    selected_cause: equipment_too_weak
    chosen_behavior: equip_upgrade
    observable_target: typical_damage
    baseline_value: 100
    target_condition: typical_damage_above_120
    evidence_deadline: next_clear_damage_feedback
    verification_state: pending
    feedback_exposures: 0

hypothesis_history: []

failure_memories:
  - target: first_prison
    attribution: insufficient_power
    baseline_state: current_power
    wake_condition: power_gain_at_least_30_percent
    attempts: 1

feedback_state:
  stock: 38
  event_freshness: {}
  fatigue: 0
  frustration: 0
  low_feedback_seconds: 0
  longest_no_gain_seconds: 0

decision_state:
  pre_abandon_emotion: steady
  abandonment_probability: 0.02
  abandonment_roll: null
  abandoned: false
```

Record evidence and confidence rather than storing omniscient truths.

Performance baselines, event prototypes, goals, attributions, behaviors, and hypotheses are context-specific. Compare current evidence with the old records, deliver feedback, then update them. Consume freeze budgets by meaningful feedback exposures rather than completed battles.

## 2. Observation And Knowledge Boundaries

At every decision point, separate:

```text
visible_now
known_before
new_inference
hidden_designer_truth
```

The simulated player may use only the first three. Do not let a player infer the value of a character, counter, rarity, field effect, or reward before the game exposes evidence.

Treat text that the target audience is unlikely to read as weak evidence, not guaranteed knowledge.

## 3. First Impressions And Learning

Create an expectation record after the first salient encounter with a concept. First impressions receive high weight because they define the initial contract.

Examples:

- If the first enemy dies in one hit, learn that ordinary enemies require almost no process.
- If the first equipment item gives about 10% power, learn that one item is a small gain but multiple slots may matter.
- If one later item raises power by more than about 30%, update the knowledge to include the possibility of large equipment gains.

Update learned exchange rates by context:

```text
observed_rate = subjective_result / max(subjective_process, epsilon)
k_new(context) = (1 - alpha) * k_old(context) + alpha * observed_rate
```

Increase `alpha` for first impressions, explicit promises, surprising outcomes, and repeated consistent evidence. Decrease it for noisy one-off events.

Do not merge unlike contexts too early. `ordinary_enemy`, `prison`, `camp`, and `boss` may learn different exchange rates.

## 4. Action Selection

Use this order as a baseline, then modify it with current emotion and learned expectations:

1. Prefer a newly discovered, untried behavior when its perceived cost is negligible.
2. Prefer actions that address an active failure attribution.
3. Prefer actions with a learned positive exchange rate and currently desired results.
4. Avoid actions with repeatedly negative process quality or violated reward expectations.
5. Give low probability to costly untried actions unless the expected result is unusually desirable.

Do not force a designed route. If the player's state does not motivate the intended action, record a design failure.

## 5. Failure Memory And Wake-Up

On failure:

1. Attribute the failure using only known concepts.
2. Store the relevant baseline, such as power, team composition, equipment state, or counter knowledge.
3. Restore at least 40 percentage points of freshness only to causally related events.
4. Create a wake-up condition for retry.
5. Check abandonment separately.

Default power wake-up hypothesis:

```text
retry_probability = clamp((current_power / baseline_power - 1 - 0.30) / 0.70, 0, 1)
```

This makes a 30% gain begin to wake the memory and a 100% gain guarantee reconsideration. If the retry fails, refresh the baseline from the new state.

Treat the formula as a tunable hypothesis, not a human law.

## 6. Emotion And Abandonment Separation

Never derive terminal abandonment directly from a low feedback stock. Keep this order:

```text
state before decision
pre-abandon emotion
abandonment probability
random or policy roll
terminal abandoned state
```

Use repeated failures, current feedback, unpaid expectation mismatch, fatigue, and recent positive diversity as inputs. A low-probability exit is a tail event, not proof that the design deterministically fails.
