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

- Fresh sessions start with one complete Warrior hero plus four militia. The active squad is Warrior, Barricade Militia, Spear Militia, and Herb Militia; Drum Militia begins in reserve.
- Main 1 uses the same two-big-wave, three-entry encounter data as the playable map. Its ten weak enemies enter as 3, then 3 when the opening group falls to two survivors, then 4 after the first big wave is cleared; every entry produces a visible cognition event.
- Clearing Main 2 for the first time adds the complete Mage hero to the roster without changing the active squad. The Mage unlock, available swap actions, and subsequent combat contribution remain explicit player-visible evidence.
- Decision requests include structured team slots and the full unlocked roster with role, unit kind, positioning, equipment occupancy, active/reserve state, and concise role descriptions.
- Decision requests do not expose evaluator-owned character experiments or the explicit `discover_new_capabilities` goal. The agent sees only the unlock, roster facts, role descriptions, legal swap actions, and hypotheses it created itself.
- Character swap experiments remain in private `evaluatorState`, where they can audit unlock -> swap -> combat evidence without instructing the player agent what to test.
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

The current onboarding run is `role_wave_run_2026-07-13_105247/` with seed `role-wave-2026-07-13-105247`.

- It contains 30 complete decision/attribution cycles, 60 logical external-agent calls, and 120 persisted request/response files.
- Main 1 ran all three entries in one continuous combat: 3 enemies at 0 seconds, 3 at 6.96 seconds, and 4 at 23.68 seconds. The squad cleared it in 37.44 seconds.
- Clearing Main 2 exposed the Mage as a complete reserve hero. The external agent voluntarily replaced Spear Militia with Mage on cycle 5, then verified Mage on Main 3 on cycle 8; Mage dealt 338.95 damage and led the squad.
- The same session cleared Main 1 through Main 10. The 30-cycle cap arrived after two Main 10 equipment actions, so the regional Boss was not attempted.
- Main 6 exposed a causal-confounding risk: the unchanged squad and equipped power lost on cycle 17, immediately retried on cycle 18, and won because attempt number changes the combat seed. Failure can therefore disappear without a player learning or applying a key.
- The run ended with 90 canonical knowledge rows and no missing evidence files or invalid subject-environment-behavior-result tuples.
- Loot never changed equipped power without a separate `equip` decision.
- `ACTION_KNOWLEDGE_CONCEPT_TRACE.md`, `run-audit.json`, and `AGENT_RUN_NOTES.md` contain the complete action trace, integrity audit, and player-agent notes.
- Decisions and attributions were supplied through a single isolated player sub-agent. Combat, loot, emotion, concepts, knowledge consolidation, and state transitions were computed by repository code; the sub-agent was closed after completing the run.

The earlier Boss-pressure comparison remains under `real_main7_run_2026-07-13_170746/`. It reached the regional Boss twice in 30 cycles but did not clear it; use it as historical evidence for late-region pressure, not as evidence for the current starter-roster and Mage-onboarding flow.
