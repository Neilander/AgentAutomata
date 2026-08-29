# UFS attention full-game playtest v13 stage 1

- Stage gate: sequence 041.
- Gate state: `status=random`, `reason=waiting_for_next_round_roll`, `pending.type=next_round_roll`, `pending.round=4`, `game.completedRoundCount=3`.
- Root audit: passed. Deterministic public replay matched, restored host checkpoint was `round=3`, `phase=new_round`, `energy=6`, `damage=1`, `researchIndex=4`, `excavatorIndex=4`, `mothershipRow=4`, `outcome=null`.
- Stage audit result: `stageGatePassed=true`; no negative energy, no excavation candidate conflict, no nonzero machine exit, no rejected operations.
- Process correction: sequences 042 onward were advanced before the formal continuation authorization. They are preserved as part of the same sealed attempt and are not hidden, deleted, or rewritten.
- Continuation point: existing checkpoint and machine ledger after sequence 049; next legal sequence is 050.

