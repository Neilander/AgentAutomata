# UFS single-anchor multi-step planning V0 results

- Run date: 2026-08-31
- Checkpoint: formal initial UFS state, five dice
- Attention: full public attention
- Activation encoder: real local `gte-multilingual-base`
- Planning passes: one
- Complete plans generated: one
- Cartesian die/cell candidates generated: zero
- Frozen checks: 14/14 passed

## What was tested

An Agent read the public scene and owned rules once and froze this macro intent:

> Increase research, but first obtain enough energy to avoid falling from energy 2 to zero; use remaining dice for visible ship pressure and no-cost rooms.

The runner then queried existing rule-reading memories in two independent groups:

- Q-after from the macro intent;
- Q-before from every visible room type in the actual player response.

Only trigger-side relevance was checked. The accepted method memories were then grounded against accessible rooms, real energy, five visible dice and one-cell-per-column feasibility.

## Activation result

The intent route ranked the directly actionable research rule first:

| Route | Accepted memory | Rank within cue | Similarity |
|---|---|---:|---:|
| Q-after intent | `research_room_advances_track` | 1 | 0.589079 |
| Q-after intent | `research_top_is_immediate_win` | 3 | 0.571017 |
| Q-after intent | `win_by_research_before_destruction` | 5 | 0.541204 |

The environment group also found methods from the relevant room cues:

| Environment cue | Accepted method | Rank within cue | Similarity |
|---|---|---:|---:|
| energy room | `energy_room_generates_energy` | 3 | 0.666162 |
| fighter room | `fighter_room_destroys_eligible_ships` | 4 | 0.649766 |
| research room | `research_room_advances_track` | 5 | 0.642692 |

The GTE lists contained unrelated high-ranked memories too. They did not become anchors because their triggering side did not match the cue's room type or intended result. This is the first use here of recall followed by current-state matching, rather than assuming every semantic neighbour is actionable.

## Anchor and completed plan

Directly paying the visible research room would change energy `2 → 0`, violating the Agent's constraint. The planner therefore formed one anchor package:

- primary anchor: gray die 4 in `A-upper-research`, expected research-room value 4;
- enabling anchor: gray dice 2 and 3 complete `A-upper-energy`, expected energy gain 2;
- remaining white dice: fighter room in column 1 and tunnel in column 3.

The five planned placements were:

1. gray 2 → energy cell, column 4;
2. gray 3 → energy cell, column 5;
3. gray 4 → research room, column 2;
4. white 5 → fighter room, column 1;
5. remaining white die → tunnel, column 3.

The white reroll was represented as a contingency. Its evaluation value, 3, was supplied only after the formal host returned `waiting_for_actual_reroll`; it was not available to intent, activation or planning.

Room actions were energy first, research second, maximum available research advance, then the affordable fighter room and end rooms.

## Formal replay

All planned operations were accepted by a separate formal session:

| Track | Before | After |
|---|---:|---:|
| Research | 0 | 2 |
| Energy | 2 | 1 |
| Damage | 0 | 0 |
| Mothership row | -1 | 0 |

The replay reached the spawn-choice boundary. It did not play the rest of the game.

## Single-step control

On the same checkpoint, the existing single-step planner generated 150 attempted and 88 legal candidates. Its stable first recommendation was gray die 2 into `A-r1-c1`, a one-step AA placement whose tracked immediate delta was zero.

This control does not prove the new plan is globally optimal. It does show the intended mechanism-level difference: the old planner selected the first member of a large immediate tie, whereas the new pass used research intent and the energy constraint to organize a delayed multi-operation plan.

## Verdict

**Single-pass mechanism: PASS.** One macro intent plus current environment produced two recall groups, a primary-plus-enabling anchor package and a formally executable five-die plan without enumerating all placements. The first support placements have no immediate track benefit, but are selected because they enable later research while avoiding zero energy.

This is not yet a general multi-pass planner and not evidence of improved win rate.

## Limits

- The macro intent is one frozen Agent output; automatic intent generation and stability were not tested.
- Full public attention was used to isolate planning from omission errors.
- Activated memories are existing rule-reading trajectories, not a newly learned personal multi-step trajectory.
- Capability grounding currently knows a small UFS rule-to-room interface.
- Secondary dice use one deterministic role order; alternative completion plans were not compared.
- Only one checkpoint, attention seed and revealed reroll were replayed.
- The experiment is isolated and has not replaced `planCurrentChoice()`.
- Replanning after state changes and selecting a different cut-in point are intentionally deferred to the multi-pass experiment.

## Evidence

- [`agent-intent.json`](agent-intent.json): frozen one-shot macro intent.
- [`evidence/single-pass-result.json`](evidence/single-pass-result.json): full queries, activations, plan, baseline, formal trace and checks.
- [`PROTOCOL.md`](PROTOCOL.md): predeclared boundary and pass conditions.

## Validation

- New planner tests: 2/2 passed.
- Real-GTE/formal-run checks: 14/14 passed.
- Full UFS regression suite: 156/156 passed.
- `git diff --check`: passed; only existing Windows line-ending warnings were emitted.
