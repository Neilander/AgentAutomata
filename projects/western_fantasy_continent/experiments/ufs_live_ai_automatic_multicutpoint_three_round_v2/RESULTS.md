# Results

## Outcome

- Single-round gate: **PASS**.
- Same-player continuation to three completed rounds: **PASS**.
- Rejected live operations: **0**.
- Random observations invented inside plans: **0**.
- Manually authored intermediate Q states: **0**.
- Formal oracle use during candidate imagination: **0**.

Round 1 passed first, so the controller was allowed to continue. Across all three rounds it made 30 planning calls, imagined 72 candidates, and retained automatic evidence for all 30 executed non-random operations. Each round encountered two white-die reroll boundaries. All six returned `paused_random`, received values only from the live random provider, discarded the old suffix, and regenerated from a higher Q revision while preserving the round's macro intent.

## Per-round record

| Round | Macro intent | Planning events / candidates | Random replans | Formal boundary: energy / research / damage | Threat: mothership / max row / total rows |
|---|---|---:|---:|---:|---:|
| 1 | restore energy before expensive progress | 12 / 27 | 2 | 5 / 1 / 0 | 1 / 5 / 7 |
| 2 | research with energy support | 11 / 29 | 2 | 2 / 4 / 0 | 2 / 9 / 19 |
| 3 | restore energy before expensive progress | 7 / 16 | 2 | 1 / 4 / 0 | 3 / 10 / 37 |

Round 1 formed and resolved a two-cell energy room, resolved research and chose +1. Round 2 resolved research and chose +3, then resolved a fighter room. Round 3 resolved a fighter room. Spawn decisions were also automatically imagined from explicit public spawn boundaries.

## Prediction versus formal audit

Formal state was read only at each safe `waiting_for_next_round_roll` boundary and was never fed back to later controller choices.

- Scalar tracks matched at all three boundaries: round, phase, energy, damage, research, excavator and mothership.
- Collection-level differences remained. Rounds 1 and 2 differed in `ships` and `placements`; round 3 differed in `placements`. These are consistent with the attention-limited belief retaining/omitting different collection members. The experiment therefore proves safe rolling execution, not complete world-model identity.

## Runtime gap found and repaired

The first attempted round reached a formal public `choose_spawn` boundary while the cognitive session had automatically passed a one-candidate spawn and reported no operation. The minimal repair was:

- allow a one-round cognitive session to start from an explicit public `spawning` decision boundary;
- preserve an explicitly requested one-candidate spawn as a player choice instead of auto-consuming it;
- rebase the cognitive belief at the public spawn boundary and add the pending ship identity from the public contract.

This is generic spawn-boundary synchronization. It does not special-case an episode, query formal state during planning, replace the default planner, or change the player generator.

## What this does and does not prove

The result establishes that automatic sequential Q generation, newest-Q replanning, hard random pauses, explicit spawn choices and three-round live execution can operate together without illegal actions.

It does **not** establish improved score, win rate or superiority over a control policy. There is one player and one random stream, no paired control, and the threat total rose from 7 to 37 by round 3 even though damage stayed zero and research reached 4. Candidate scoring and longer-horizon threat/resource trade-offs remain weak.
