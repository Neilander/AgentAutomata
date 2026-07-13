# Frozen Player Cognition V1

Frozen at: 2026-07-13 03:56 CST

Status: Phase 1 independently accepted. This version is the required player/parser configuration for initial Phase 2 paired gameplay A/B tests.

## Strictly Frozen

| File | SHA-256 |
|---|---|
| `game_data/player-cognition-v1-event-runtime.js` | `3B90EAB1620C624852FD1B7067F704942201F2150B99825A6DEF9C8C005397CC` |
| `game_data/player-cognition-v1-action-policy.js` | `B5E599265FD2CCBA2AEFB3695457D23BCC424FC97D69554E093B48B9D531AFE9` |
| `game_data/map-cognition-v1-event-adapter.js` | `DA70A1272A01EB68C8E9FA5B794F7770987568C2D59DAA69B20D4DC40F4D2F27` |

Do not change these files during a gameplay A/B. A future model calibration must create V2, rerun Phase 1 causal controls, obtain independent acceptance, and freeze a new manifest.

## Observation Contract Baseline

| File | SHA-256 |
|---|---|
| `game_data/combat-signals.js` | `E81A15C687D358220BA24DF67EADF2990CB582537D253825A82F96DF8993E3EA` |

Presentation is gameplay input. A Phase 2 variant may intentionally change presentation evidence, but both variants must use the same cognition runtime and the change must be reported as the causal game-design difference.

## Game Baseline Reference

| File | SHA-256 |
|---|---|
| `map_progression_lab/map-progression-cognition-core.js` | `F5244EA1CEC506F94CE27FA58EF83C016D859E193309F90E4230AAAC28778F9E` |

The game core is not a frozen psychological component. It is recorded so Phase 2 can identify exactly which gameplay rules changed.

## Accepted Causal Controls

- Real event visible versus hidden.
- First observation versus learned repetition.
- Immediate versus delayed expectation.
- Reasonable dry, probability success, and abnormal dry.
- Normal action end versus defeat interruption.
- With and without a valid hypothesis.
- Same visible state before and after real failure knowledge.
- Same deterministic game trajectory with visible versus occluded feedback, producing event-derived emotion and different next actions.

## Residual Calibration Risk

The optional-risk curve and default goal values are provisional human-plausibility assumptions. They passed causal validation but are not universal human constants. Validate them against human traces later; do not silently tune them during gameplay optimization.
