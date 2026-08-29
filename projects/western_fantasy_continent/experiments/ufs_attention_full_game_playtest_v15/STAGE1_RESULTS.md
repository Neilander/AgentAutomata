# UFS V15 Stage 1 Results

Status: stage boundary reached, strict public evidence verification failed.

## Stop condition

The run stopped at `evidence/083.stdout.json` with the requested three-round safety boundary:

- `status=random`
- `reason=waiting_for_next_round_roll`
- `pending.type=next_round_roll`
- `pending.round=4`
- `game.completedRoundCount=3`

No Round 4 dice were submitted. The game did not reach a true terminal outcome before this boundary; `game.outcome` was `null`.

Final public state at the stop boundary:

- `damage=0`
- `energy=2`
- `researchIndex=4`
- `mothershipRow=3`
- `phase=new_round`

## Validation

Command run:

```text
node verify-public-evidence.js
```

Result:

```text
FAILED: nonzero exit at 002
```

Interpretation:

- The strict verifier rejects this attempt because step `002` records an early malformed recorder invocation / nonzero exit.
- The same attempt later continued through public accepted/rejected recorder states and reached the intended three-round boundary.
- This attempt should not be treated as clean verifier-passing evidence.

## Public artifacts produced

- `DECISIONS.md`
- `evidence/001.stdout.json`
- `evidence/002.stderr.txt`
- `evidence/002.stdout.json`
- `evidence/003.stdout.json` through `evidence/083.stdout.json`
- `ROUND_SUMMARIES.md`
- `STAGE1_RESULTS.md`

## Notes on rejected operations

All in-game formal rejections after the malformed `002` CLI attempt were handled by continuing the same attempt from the public state, as required by the protocol.

Notable recoveries:

- Room payment requires explicit `pay:true`.
- Research room choice accepts `choose_research_advance` with `roomId` and an integer `advanceSteps` within the public bound.
- Spawn choice accepts `choose_spawn` with `shipId` and `dropPointId`.

One rejected `skip_worker` payload was recorded before the later clarification that research room effects must use `choose_research_advance`; it did not alter game state and is preserved in the public evidence.

## Unresolved risks

- The attempt is not a clean stage-gate transcript because `verify-public-evidence.js` fails at `002`.
- The number of rejected public payload probes makes this attempt noisier than a final acceptance run should be.
- Root/audit should decide whether to treat this as a failed V15 evidence attempt or authorize a fresh clean attempt using the recovered operation schemas.

## Recommended next step

Run a fresh clean stage attempt only if root wants verifier-passing evidence. Use the learned public schemas from this attempt:

- `resolve_room` with `pay:true` when the formal host requires payment confirmation.
- `choose_research_advance` with `roomId` and `advanceSteps`.
- `choose_spawn` with `shipId` and `dropPointId`.
