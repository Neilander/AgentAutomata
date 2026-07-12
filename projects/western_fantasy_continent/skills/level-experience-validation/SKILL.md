---
name: level-experience-validation
description: Validate combat levels, map nodes, teaching encounters, lock-key checks, role showcases, resource stages, and bosses with real combat, exhaustive or sampled team-state testing, progression-appropriate standard equipment, and a frozen player-emotion model. Use before accepting or tuning any level whose intended lesson, favored roster direction, difficulty gate, or emotional timing must be demonstrated rather than assumed.
---

# Level Experience Validation

Prove two things independently:

1. The combat state space favors the intended lesson or team direction.
2. The player reaches, interprets, and resolves that lesson with a healthy emotion curve.

A level fails if either proof is missing.

## Required Inputs

Before simulating, write:

```text
Level type:
Progression stage:
Standard equipment profile:
What the player already knows:
What this level should teach or test:
Favored team/role/mechanic:
Valid alternative solutions:
Plausible wrong solutions:
Visible evidence of success/failure:
Expected emotion curve:
Forbidden outcomes:
```

Do not infer the lesson from whichever team happens to win.

## Choose The State-Space Method

Estimate the legal player state count:

```text
team selections x formations x allowed skill/loadout choices
```

Keep equipment fixed to the current progression stage while testing the lesson.

### Small State Space: Exhaustive

Enumerate every legal team and relevant formation when the full space can be run within the task budget. Use a default practical ceiling of about 1,000 deterministic states, but prefer actual runtime cost over a rigid count.

For every state, record:

- win rate across seeds
- duration and survivors
- first ally/enemy death
- damage, healing, shield, and control contribution
- target mechanic evidence
- emotion trace
- classification: `teaches`, `acceptable`, `accidental`, or `fails`

Do not inspect only passing teams.

### Large State Space: Standard-Team Sampling

When exhaustive testing is impractical, build about 20 coherent teams. Adjust the count when diversity or risk requires it.

Include:

- 4-6 teams expressing the intended direction
- 4-6 adjacent or partial-synergy teams
- 4-6 current mainstream strong teams
- 2-4 plausible wrong teams
- 1-2 raw-power or negative-control teams

Teams must be playable constructions, not random bags of roles. Record why each team belongs to its group before seeing results.

### Character-Focused Validation

To test whether a level favors one character, use matched pairs:

```text
same three teammates + target character
same three teammates + role-equivalent replacement
```

Repeat across several shells. The claim is supported only when teams containing the character improve for the intended reason, while reasonable teams without that character are meaningfully worse but not necessarily impossible.

Apply the same matched-pair method to a skill, field effect, equipment key, or formation rule.

## Standard Equipment Rule

Use equipment appropriate to the player's current stage:

- early white-equipment stage: standardized white equipment
- established rare-equipment stage: standardized rare equipment
- later mixed stage: the declared stage distribution

Keep total equipment strength comparable across teams. Use role-appropriate allocation, but do not secretly give the intended team bespoke counter gear unless the level is explicitly testing that gear.

Always report the equipment profile with the results.

## Real Combat Rule

Use the production combat engine and real signals. Do not use score-only outcomes or a separate simplified combat formula as acceptance evidence.

Run enough seeds to separate deterministic mechanics from targeting or proc variance. Save traces so a failed claim can be inspected without rerunning.

## Teaching Proof

A level does not teach a mechanic merely because the intended team wins or contributes high damage.

Require:

- the ordinary or plausible-wrong state encounters the intended problem
- the intended state produces a meaningful improvement
- the improvement is caused by the target mechanic
- the relevant difference is visible in combat signals
- most natural passing states teach or reinforce the intended lesson
- unrelated dominant teams do not erase the lesson

For a favored direction, compare distributions, not a single showcase fight:

```text
favored-group win rate
adjacent-group win rate
mainstream-group win rate
wrong-group win rate
effect size and uncertainty
```

Set numeric thresholds from the declared level type. Do not turn one project's provisional threshold into a universal rule.

## Emotion Validation

Read `../player-cognition-simulation/SKILL.md` before emotion validation. For probability-driven rewards, also read `../player-cognition-simulation/references/probability-expectation.md`.

Freeze the emotion-model version before tuning the level. Feed the exact production combat/event timeline into that version.

Report per stage or node:

- emotion/feedback before entry
- process gains and costs over time
- minimum value during combat
- result, loot, decision, and verification deltas
- current goal and hypothesis
- emotion after exit
- value at the first meaningful failure

Aggregate completion rate is insufficient. A boss that is numerically fair can still fail if the player reaches it already exhausted.

Do not adjust the emotion model and the level in the same iteration. If the prediction conflicts with a known human judgment, open a model-calibration task, freeze the level, and preserve the conflicting trace.

## Acceptance Gate

Accept only when all are true:

1. The declared lesson is supported by exhaustive or sampled combat evidence.
2. Passing-solution density matches the level type.
3. Intended teams/roles improve for the intended causal reason.
4. Plausible alternatives and wrong solutions behave as declared.
5. Players receive enough visible evidence to diagnose the result.
6. The frozen emotion model places pressure, relief, and reward at the intended times.
7. The next action remains visible when a player is blocked.
8. Shared combat and role regression checks still pass.

If the level fails, state whether the failure belongs to encounter design, role identity, equipment stage, presentation/signals, player policy, or emotion-model calibration before changing anything.

## Output

Use the report structure in [references/validation-protocol.md](references/validation-protocol.md). Preserve raw matrix/trace paths and explicitly mark unrun checks.

