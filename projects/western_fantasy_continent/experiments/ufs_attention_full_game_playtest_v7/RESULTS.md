# Results

## Outcome

The single attempt completed six full rounds and entered round 7. It did **not** publicly return win or loss. Step 090 returned a genuine terminal `attention_stop` with `reason=no_complete_initial_q`, a still-pending placement, and an empty operation list. The honest classification is therefore **unknown / attention_stop**, not a win or loss inferred from tracks.

Final public observation: damage 0, energy 7, excavator 2, mothership 8, research 4, round-7 dice phase, outcome null. The terminal status is attributable to the attention/program layer being unable to form a complete initial `q` for the selected placement, not to an explicit rules-engine victory or defeat.

## Scale and integrity

- One fresh state directory and one Attempt only.
- Fixed `UFS_ATTENTION_SEED=2026082507` throughout.
- 90 public CLI calls: 1 start, 76 advance, 13 random.
- 6 completed rounds plus a partial round 7.
- 5 atomic rejected calls, all preserved: three payload-shape errors, one occupied-column error, and one incomplete-room error.
- Every white reroll and new-round roll used `random`; no die result was invented.

## Why the position deteriorated

There is no explicit loss to explain, but the public position deteriorated from mothership -1/research 0 to mothership 8/research 4. The clearest public causal chain was round 4:

1. The player aligned an explosion-5 and explosion-3 target for two intended fighters.
2. The planned strength-5 path fighter was actually a two-cell scripted room and was incomplete.
3. Its resolution was atomically rejected, so only the strength-3 single-cell fighter worked.
4. The high target survived; the boundary publicly changed mothership 4→6 and research 6→5.
5. Later rounds could clear many ordinary ships, but an already-overflowed ship persisted at rows 16 and 19 and continued to coincide with boundary penalties.

Round 5 showed that the defensive concept itself could work: four ships were deliberately aligned at explosion values no greater than 5 and all four were removed by one complete strength-5 fighter. The damaging error was therefore room-completion reasoning and placement sequencing, not merely insufficient tactical attention.

## Resource → excavation → research planning

The chain formed across rounds rather than appearing as isolated greedy moves:

- Round 1 accumulated energy and reached research 2.
- Round 2 spent one energy to excavate unlock 1, then spent energy on research to reach 4.
- Round 3 rebuilt energy, excavated unlock 2, and advanced research to 6.

This is a real multi-round plan: resource accumulation funded both excavation and research, while excavation progressively opened deeper path cells. It later broke under threat pressure. Rounds 4–5 were defensive, round 6 rebuilt energy, and the round-7 first action attempted to resume path research. Public penalties had already reduced research 6→5→4, so development progress was not durable.

## Attention omissions and changed actions

Omissions materially affected reasoning:

- Dice sometimes vanished from `observation.dice` while remaining present in the public `lastAction.values`; the player used the earlier literal stdout/work memory rather than treating disappearance as absence.
- Ships repeatedly disappeared and reappeared. Purple-4 disappearing after round 2 was initially tempting to interpret as destruction; its later reappearance forced explicit correction. Thereafter missing ships were carried in working memory.
- Placements often disappeared from the noticed observation immediately after acceptance. The player relied on the public `lastAction`, prior placement IDs, and later room-phase lists.
- When only a subset of rooms/cells was noticed, earlier public map observations supplied known IDs. This enabled continued planning but also increased working-memory load and contributed to the column/room-completeness mistakes.
- In round 7 the omission became terminal rather than merely inconvenient: the requested placement could not obtain a complete initial attention `q`, so the public interface offered no legal continuation.

## Incorrect inferences and propagation

Several incorrect inferences were visible and consequential:

- **AA semantics:** the early model treated AA as static suppression. Public movements later supported `net movement = die value - 1`. The correction improved later threat alignment.
- **Fighter eligibility:** the round-2 fighter looked ineffective after AA ordering moved the presumed target. Round 3 then validated that a fighter removes ships sitting on explosion values within its strength, and round 5 established that it removes all qualifying ships.
- **Payload memory:** steps 025/027/028 omitted `roomId` or used `steps` instead of public-help `advanceSteps`. They caused no game-state mutation, but demonstrate format memory decay and added three rejected calls.
- **Column occupancy:** step 053 attempted a second placement in C3 and was rejected. The correction was local.
- **Multi-cell room completeness:** step 055 assumed a single path-fighter placement completed a two-cell room. This was the most damaging inference. Because the other cell's column was already occupied, correction was impossible; the error propagated into the end-of-round mothership/research penalty and forced later all-defense rounds.

## When the plan changed because loss looked near

- Round 2: visible ships near rows 7–9 caused a pivot from a second resource completion toward fighter/AA defense.
- Round 3: mothership rose to 3 during placement, so the final die was assigned to a fighter instead of additional free research.
- Round 4: mothership 4 led to abandoning excavation/research entirely. The attempted all-defense plan failed on incomplete-room reasoning.
- Round 5: after mothership 6 and research regression, every placement served fighter construction or AA alignment; the round successfully cleared four targets.
- Rounds 6–7: with mothership 7–8, choices minimized mothership triggers while trying to regain enough resource/research to avoid pure stagnation.

## Did decisions degenerate into a fixed routine?

No. The action mix changed substantially with public state:

- R1: energy + research.
- R2: excavation + research + improvised defense.
- R3: energy + excavation + research + validated fighter.
- R4: all-column defense with two intended fighters.
- R5: coordinated AA alignment plus one complete mass-clear fighter.
- R6: threat freezing plus capped energy recovery.
- R7: attempted return to path research before attention stopped.

There was a recurring structural motif—use AA to align explosion cells, then resolve a fighter—but it was conditional on ship rows and fighter strength, not a fixed action sequence. The development plan was also suspended when the public threat track made continuation unsafe.

## Honest limitations

- No explicit win/loss occurred; outcome analysis must not promote the threatening mothership track into a fabricated loss.
- Attention output is lossy, so cross-step ship histories are player working-memory reconstructions anchored in public stdout, not private state truth.
- The state directory exists only because the public CLI needs persistence and was not inspected by the player or verifier.
- This is one seed and one game, suitable for behavioral diagnosis but not a statistical win-rate claim.
