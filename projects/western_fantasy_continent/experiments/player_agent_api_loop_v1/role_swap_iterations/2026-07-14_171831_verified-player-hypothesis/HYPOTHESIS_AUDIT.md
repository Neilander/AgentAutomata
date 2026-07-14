# Player Hypothesis Audit

## Verdict

PASS for the explicit hypothesis lifecycle. This run does not by itself validate the absolute emotion weights.

## Proven Chain

1. Cycles 1-20 replay the recorded deterministic prefix. Legacy hypotheses that the old runtime had already rejected were preserved as source responses and explicitly stripped only from replay application.
2. At cycle 21, a fresh decision agent observed that the rescued Ranger had no active-team contribution knowledge and that Barricade Militia previously dealt 3.34% of team damage.
3. The agent selected `swap:1:hero_ranger` and created a measurable next-combat hypothesis: Ranger damage share should exceed 3.34%.
4. The hypothesis persisted as `pending` through the swap and a separate bow-equipment action.
5. Main 6 emitted a real `team_experiment_result` built from combat signals. Ranger dealt 675.8483 damage, 35.04% of team damage, and ranked second.
6. The runtime compared 35.04% to the precommitted 3.34% threshold, marked the hypothesis `confirmed`, and emitted `EVerify=1` on that event.
7. The next decision request exposed the confirmed hypothesis to the agent.
8. At cycle 24, the same agent formed a distinct current-action hypothesis for Main 7: Ranger should rank first against the single high-health target.
9. Main 7 emitted Ranger damage rank 1 and damage share 43.88%; the runtime confirmed the hypothesis and emitted a second `EVerify=1`.

## Emotion Nodes

| Cycle | Action | EDecision | Decision emotion | EVerify | Automatic event emotion |
| --- | --- | ---: | ---: | ---: | ---: |
| 21 | swap Ranger in | 4 | +0.16 | 0 | +0.0000 |
| 22 | equip Ranger bow | 1 | +0.04 | 0 | -0.0014 |
| 23 | clear Main 6 | 1 | +0.04 | 1 | +0.9820 |
| 24 | clear Main 7 | 4 | +0.16 | 1 | +0.8045 |

Each verification contributes +0.06 inside the automatic event total. The rest comes from the frozen event-emotion model.

## Guardrails Exercised

- An incomplete hypothesis reasoning chain throws instead of being silently discarded.
- A next-combat hypothesis requires a measurable target condition.
- Pending hypotheses survive unrelated actions.
- Confirmed, refuted, and inconclusive outcomes are tested separately.
- Missing metrics do not grant EVerify.
- Explicitly observed zero contribution refutes the expectation.
- Duplicate hypothesis IDs are rejected.
- A bad final attribution citing unrelated evidence was rejected and retained as `48-rejected-response.json`; the corrected response was then accepted.

## Remaining Risks

- The formation reward (+0.16) and verification reward (+0.06) are model parameters, not yet human-calibrated excitement measurements.
- Damage share and rank prove contribution, not that Ranger alone caused the win.
- Only one fresh agent trajectory was run after the deterministic prefix.
- Current support is intentionally narrow: combat contribution metrics only. Other delayed hypotheses need explicit event contracts before use.

