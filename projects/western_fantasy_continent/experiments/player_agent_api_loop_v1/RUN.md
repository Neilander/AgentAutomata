# Two-Cycle Live Agent Run (Invalidated)

> This run is retained only as evidence of a rejected implementation. It incorrectly treated loot as automatic equipment growth and created a fictitious `receive_reward` behavior. Do not use its results as current player knowledge. The corrected compact run is `causal_verification_v8/summary.json`.

## Corrected Run

1. `challenge:r1_main_1` wins, unlocks Main 2, and drops two common gloves into inventory. Equipped item count remains `0`; equipped power remains `0`.
2. `equip:hero_warrior:r1_main_1_1_0` is an explicit player decision. Inventory falls from `2` to `1`, equipped item count rises from `0` to `1`, and equipped power rises from `0` to `40`.

The corrected run produces 12 compact canonical knowledge rows: progression, loot-without-power, four combined unit contributions, team damage, encounter threat, two enemy-role threats, and explicit equipment. Individual disposable enemies and ordinary skill events remain only in the event log.

## Rejected Run Details

- Time: 2026-07-13 14:26 Asia/Shanghai
- Result: PASS for the minimum architecture loop
- Scope: two decision API calls and two attribution API calls
- Formal gameplay or Frozen V3 changed: no

## Architecture Proven

The code owns persistent game and cognition state. It advances real combat, emits events, and automatically updates H, expectation, PQRA emotion, goals, failure memory, event statistics, and canonical subject-environment-behavior-result knowledge. An external AI is called only at two boundaries:

1. Decision request: choose one legal action from current observations and cognition state.
2. Attribution request: explain the observed result using exact visible event IDs.

The AI response contracts do not contain writable emotion or PQRA fields.

## Live Run

| Cycle | Decision AI | Real result | Automatic emotion | Attribution AI |
| --- | --- | --- | --- | --- |
| 1 | `challenge:r1_main_1` | win | `38.0000 -> 38.8686` | win attributed to eliminating all enemies with four survivors; cited four real event IDs |
| 2 | `challenge:r1_main_2` | win | `38.8686 -> 39.7485` | win attributed to eliminating all enemies with four survivors; cited four real event IDs |

The second decision request included cycle-one emotion, goal progress `0.12`, and two canonical knowledge records: Main 1 challenge produced a four-survivor win and Main 1 rewards raised visible power from `0` to `42`. The decision AI explicitly cited both records and selected newly available Main 2 instead of repeating farmable Main 1.

Final state:

- API call sequence: decision, attribution, decision, attribution.
- Completed cycles: `2`.
- Internal event-statistics entries: `54`; these are not exposed as knowledge.
- Canonical subject-environment-behavior-result knowledge entries: `4`.
- AI attributions attached to encounter-result knowledge: `2`.
- Final emotion: `39.74845`.
- Emotion totals: process `-0.4148`, acquired `+2.18895`, expectation `-0.0257`.

## Validation

- Replayed both cycles from a fresh session with the recorded AI responses.
- Final emotion matched exactly.
- Event-statistics count matched exactly.
- All four canonical knowledge records and attached attributions matched exactly.
- Illegal actions are rejected before game execution.
- Attribution evidence IDs are checked against the real event log before attribution is attached to result knowledge.
- Frozen V3 source files and formal gameplay assets were not edited.

## Limits

- This proves orchestration, not player-model validity.
- Both sampled encounters were wins, so failure attribution has not been exercised.
- The attribution agent overemphasized the final meteor kill as the primary cause. Evidence binding prevents fabrication, but causal quality still needs a reviewer or a stronger attribution contract.
- The inherited map strings contain encoding corruption.
- Attribution requests are filtered but still larger than desirable.
- Decision effort E remained zero in this run because the returned alternative list did not satisfy Frozen V3's existing comparison validator. This does not block the API loop, but the contract should later align with E validation.

## Files

- `player-agent-loop.js`: persistent loop and AI response contracts.
- `cli.js`: pause/resume driver for external API calls.
- `run/`: live AI requests, responses, session, and summary.
- `verification/`: deterministic replay evidence.
