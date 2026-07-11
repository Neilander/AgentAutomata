# First-Level Weak-Wave Combat

- Date: 2026-07-10
- Scope: `r1_main_1` only
- Feedback: early combat feels too long; reuse the established big-wave/small-wave structure with weak enemies

## Analysis State

```text
state: experience
goal: identify the relevant existing combat pattern
methods_used: inspect the map-lab wave preview and prior regroup/queue/camera behavior
output: the accepted reference is two big waves; big wave 1 has two small waves, then regroup and march, then big wave 2 enters
next_state: distill

state: distill
goal: define the desired first-level experience
methods_used: combat-rhythm analysis
output: perceived length should be reduced through frequent weak-enemy kills and visible reinforcement beats, not through one longer low-pressure enemy team
next_state: review_distillation

state: review_distillation
goal: confirm the target
methods_used: direct user feedback as call_feedback
output: accepted; change only the first level and keep every enemy weak
next_state: compare_current_game

state: compare_current_game
goal: identify the concrete mismatch
methods_used: formal battle-path inspection
output: the wave director existed only in the preview page; formal map fights still started one static enemy team, so the first level had no kill cadence or reinforcement rhythm
next_state: review_checks

state: review_checks
goal: bound the change
methods_used: direct user constraints
output: accepted checks are first-level-only activation, two big waves, three enemy entries, weak enemy kits, real combat resolution, and no later-node changes
next_state: implementation_plan

state: implementation_plan
goal: implement and validate the first playable wave fight
methods_used: shared combat reinforcement API, isolated encounter data, deterministic combat replay
output: implemented
next_state: call_feedback through hands-on play
```

## Encounter Design

1. Big wave 1-1: three weak melee units enter.
2. When one or fewer remain, big wave 1-2 enters as one weak melee plus two weak ranged units.
3. After big wave 1 is cleared, allies regroup around the leftmost survivor, wait 0.5 seconds, and march right in formation.
4. Big wave 2: two weak melee plus two weak ranged units enter as the final group.

The ten enemies have no functional active skill, passive, or ultimate. Melee units have 30 HP; ranged units have 22 HP. Their purpose is to be cleared visibly, not to test the player's build.

## Validation

- 60 deterministic runs using the initial roster and shared `CombatSimulation`.
- Win rate: 100%.
- Average combat time: 9.0 seconds.
- Range: 8.8-9.5 seconds.
- Average surviving allies: 4.0.
- Average enemy damage: 56.5.

Browser presentation remains unverified because the user's local server on port 3777 was not running and no extra server was started.

