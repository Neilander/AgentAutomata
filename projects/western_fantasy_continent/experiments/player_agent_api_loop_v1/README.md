# Player Agent API Loop V1

This isolated experiment proves the smallest intended cognition architecture:

```text
code-owned game state
-> automatic real event generation
-> automatic signal, expectation, PQRA, emotion, and event-statistics update
-> code updates canonical subject-environment-behavior-result knowledge
-> decision API request
-> AI returns one structured action
-> code executes the action
-> attribution API request
-> AI returns evidence-bound causal attribution
-> code attaches attribution to the matching result knowledge
-> next cycle
```

Before the emotion runtime or canonical knowledge sees combat events, `signal-concept-interpreter.js` converts the engine log into a player-semantic log. The session keeps `rawEventLog` only for audit; agent requests and learned knowledge use `eventLog`, where disposable enemy identities are replaced by concepts such as `近战小怪` and `远程小怪`.

The AI is not allowed to set emotion or PQRA values. The decision response must select an allowed action. The attribution response must cite event IDs produced by the game. Low-level Frozen V3 entries are treated as event-statistics caches, not player knowledge. Canonical knowledge always contains subject, environment, behavior, and structured result observations. This experiment does not modify Frozen V3, formal combat values, production skills, or any webpage.

## Causal Knowledge Rules

- Clearing a level causes map unlocks and loot drops. There is no invented `receive_reward` player behavior.
- Loot is placed in inventory. It never changes equipped power by itself.
- `equip:<heroId>:<itemId>` is an explicit player decision. Only that action may move an item from inventory to a hero and change equipped power.
- Combat reports produce queryable knowledge about team damage, each unit's combined contribution, and enemy-role threat. Disposable enemy instances and ordinary skill events remain in the battle log instead of long-term knowledge.
- Repeated observations update the same generalized row. Character and enemy-role patterns use encounter bands such as early main, while exact unlocks and drops retain their node.
- Each knowledge row keeps at most eight recent observations; sample counts and outcome distributions continue accumulating.
- Every canonical knowledge row has `subject`, `environment`, `behavior`, and `result`; the behavior must be a real cause of the recorded result.
- Raw enemy IDs and internal enemy names must not enter the emotion runtime, attribution request, decision request, or canonical knowledge.
- Concept matching must happen before learning; post-hoc knowledge filtering is invalid.

The source map prototype still contains automatic equipment behavior. This experiment deliberately removes that side effect in its adapter and leaves the formal map prototype unchanged.

## Two-Cycle Protocol

```powershell
node cli.js init session.json
node cli.js request session.json decision-1-request.json
node cli.js decision session.json decision-1-response.json
node cli.js request session.json attribution-1-request.json
node cli.js attribution session.json attribution-1-response.json

node cli.js request session.json decision-2-request.json
node cli.js decision session.json decision-2-response.json
node cli.js request session.json attribution-2-request.json
node cli.js attribution session.json attribution-2-response.json

node cli.js summary session.json summary.json
```

Each response file represents one external AI API call. The session file is the persistent code-owned state between calls.

Run `node verify-causal-loop.js` for the regression check. The current accepted evidence is under `causal_verification_v9_concept_interpreter/`; the older `run/` and `verification/` folders document rejected implementations and must not be used as current evidence.

## Long-Run Evidence

The current fresh long run is `real_main7_run_2026-07-13_170746/` with seed `real-main7-2026-07-13-170746`.

- It contains 30 complete decision/attribution cycles, 60 logical external-agent calls, and 120 persisted request/response files.
- The same session advanced from Main 1 through Main 10, unlocked the regional Boss, and challenged it twice.
- The Boss was reached but not cleared. Attempt one used equipped power 601; attempt two used 673 after one explicit offensive equipment change. Both ended in a 21.12-second loss with four enemies alive.
- The run ended with 103 canonical knowledge rows and no invalid subject-environment-behavior-result tuples.
- Loot never changed equipped power without a separate `equip` decision.
- `ACTION_KNOWLEDGE_CONCEPT_TRACE.md` preserves the earlier Main 7 snapshot. `ACTION_KNOWLEDGE_CONCEPT_TRACE_TO_BOSS.md` and `run-audit-to-boss.json` contain the 30-cycle continuation and integrity audit.
- Decisions and attributions were supplied turn by turn by the current assistant. Combat, loot, emotion, concepts, knowledge consolidation, and state transitions were computed by repository code.
