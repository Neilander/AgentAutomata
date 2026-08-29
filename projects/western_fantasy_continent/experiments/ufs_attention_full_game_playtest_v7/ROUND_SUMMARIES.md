# Public round summaries

All values below come from preserved public stdout. A missing noticed item is treated as an attention omission, never as proof that the underlying item ceased to exist.

## Round 1 — steps 001–015

- Started at energy 2, research 0, excavator 0, mothership -1.
- Built the two-cell upper energy room, paid for upper research, and advanced research by 2.
- The first AA uses were based on an incorrect early intuition that AA was primarily static suppression. Public ship movement contradicted that intuition and began the later `die - 1` working model.
- Boundary after spawn: energy 5, research 2, excavator 0, mothership 0; completed rounds 1.

## Round 2 — steps 016–032

- Used the unlock-1 path placement as a distance-1 excavation candidate, advancing excavator 0→1.
- Paid upper research and advanced research 2→4. This completed the first explicit resource→excavation→research cross-round chain.
- Threat growth caused a mid-round pivot from a second energy plan to fighter plus AA placements.
- The fighter initially achieved no removal because the AA ordering moved the expected target away from its explosion cell. This was the first tactical inference error with a visible downstream cost.
- Three payload-format rejections occurred at steps 025, 027, and 028; all were atomic, retained, and corrected from public errors/help.
- Boundary: energy 1, research 4, excavator 1, mothership 2; completed rounds 2.

## Round 3 — steps 033–046

- Rebuilt energy first, then excavated the unlock-2 path: excavator 1→2.
- Paid research and advanced 4→6.
- After mothership reached 3 during placement, abandoned an extra research option and used a strength-4 upper fighter. It removed the ship publicly aligned with explosion 4, validating the explosion/fighter relationship.
- Energy was publicly capped at 7 rather than reaching the naive arithmetic expectation of 8.
- Boundary after spawn: energy 3, research 6, excavator 2, mothership 4; completed rounds 3.

## Round 4 — steps 047–061

- Entered in a fast-loss posture and used all five columns for defense rather than repeating the development routine.
- AA placements aligned ships at explosion 5 and explosion 3. A final attempted AA at step 053 was rejected because column C3 was already occupied; the correction used the only free column.
- The central failure was step 055: the planned strength-5 path fighter was rejected because the scripted two-cell room was incomplete. The player had incorrectly assumed one placement completed it.
- A valid strength-3 upper fighter still removed the explosion-3 target, but the explosion-5 target remained.
- Boundary penalty was severe and public: mothership 4→6 and research 6→5; completed rounds 4.

## Round 5 — steps 062–076

- With mothership 6, used a complete single-cell strength-5 fighter and four AA placements.
- The AA plan aligned four ships at explosion values 5/4/4/4. The fighter removed all four in one resolution, proving fighter resolution applies to all qualifying ships rather than only one.
- A ship already beyond row 15 could not be recovered; end-of-round mothership rose 6→7.
- Two destroyed ships were manually respawned into separate low rows/columns.
- Boundary: energy 1, research 5, excavator 2, mothership 7; completed rounds 5.

## Round 6 — steps 077–088

- Used a value-1 AA to freeze the high white ship at row 10 and avoid a row-11 mothership effect.
- Tried moving the already-overflowed purple ship farther out, but it persisted publicly through row 19.
- Completed a 6+6 upper energy room and hit the public energy cap 7.
- End penalty raised mothership 7→8 and reduced research 5→4; outcome remained null.
- Boundary: energy 7, research 4, excavator 2, mothership 8; completed rounds 6.

## Round 7 partial — steps 089–090

- The required new-round random call returned public values gray 4/3/6 and white 1/1.
- The planned first placement was a value-6 path research worker intended to resume development without moving a remembered threatened column.
- The public CLI returned `attention_stop`, `reason=no_complete_initial_q`, pending placement for `r7-gray-2`, and `availableOperations=[]`.
- No seventh round action was accepted. Per the requested terminal contract, play stopped immediately without restart, rollback, seed change, or another operation.
