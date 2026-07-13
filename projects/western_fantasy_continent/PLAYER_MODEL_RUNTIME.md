# Executable Player Model Runtime

This is the durable entry point for the currently executable AI playtest loop. Future agents must use this document instead of reconstructing the architecture from chat history or old reports.

## What Is Executable

The current source lives in:

```text
experiments/player_agent_api_loop_v1/
```

The directory name records its maturity, but its implementation is persisted source code, not temporary chat output.

Important files:

- `player-agent-loop.js`: owns persistent game state, cognition state, concept state, knowledge, and API-call boundaries.
- `signal-concept-interpreter.js`: converts raw engine entities into player-visible concepts before cognition.
- `cli.js`: starts, pauses, resumes, and summarizes a run using JSON session files.
- `verify-causal-loop.js`: required deterministic regression.
- `summarize-main7-run.js`: long-run per-action knowledge/concept trace and integrity audit.
- `README.md`: implementation contract.
- `causal_verification_v9_concept_interpreter/`: current accepted two-cycle evidence.
- `real_main7_run_2026-07-13_170746/`: fresh 20-action Main 1-7 evidence with every request, response, raw log, semantic log, learning delta, and audit.

`.js` means JavaScript source code. These files are executed by Node.js. They are not design prose and do not require a browser.

## Fixed Runtime Shape

```text
code owns game and player state
-> code asks AI for one decision
-> code executes a real action and battle
-> raw game events are generated
-> signal interpreter maps visible evidence to player concepts
-> code updates H, expectations, PQRA, emotion, goals, statistics, and causal knowledge
-> code asks AI for evidence-bound attribution
-> attribution is attached to learned knowledge
-> next decision cycle
```

The AI is an API dependency at two boundaries only:

1. `decision`: choose one allowed behavior using current observations and knowledge.
2. `attribution`: explain an observed result using semantic event IDs and learned knowledge.

The AI must not directly set emotion, PQRA, Agency, power, drops, knowledge, or game results.

## Signal Boundary

Every action stores two logs:

- `rawEventLog`: full engine data for debugging; never exposed to the simulated player.
- `eventLog`: concept-level player-semantic events consumed by emotion, knowledge, attribution, and decisions.

Required order:

```text
raw event -> visible feature -> concept -> semantic event -> cognition -> knowledge
```

Current verified concepts include `近战小怪` and `远程小怪`. Internal identities such as disposable unit IDs and enemy database names are prohibited beyond the raw audit log.

## How To Verify

From the repository root:

```powershell
node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js
```

Expected result:

- `result: PASS`
- two completed cycles;
- loot does not increase power until an explicit equip action;
- 12 compact causal knowledge rows in the two-cycle run;
- repeated encounters consolidate instead of producing per-enemy or per-skill knowledge spam;
- no raw enemy name or disposable ID in semantic events, agent requests, or canonical knowledge.

For a manually paused external-agent run, use the commands in `experiments/player_agent_api_loop_v1/README.md`.

The current long-run evidence can be regenerated into a readable trace with:

```powershell
node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/summarize-main7-run.js projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/real_main7_run_2026-07-13_170746/session.json
```

Its audit must report Main 7 cleared, 80 request/response files, 20 raw and semantic event logs, no invalid canonical knowledge, and no decision outside the allowed-action list.

## Source Of Truth

Use this precedence:

1. Executable code and passing regression.
2. `PLAYER_MODEL_RUNTIME.md` and `player_model_runtime.json`.
3. `skills/player-cognition-simulation/` rules.
4. Current accepted evidence directory.
5. Timestamped handoff reports.
6. Old run folders and chat summaries.

Old reports remain historical evidence. They must not silently override the current executable contract.

## Current Limits

- This is an executable integration reference, not yet the production game runtime.
- The two-cycle minimum covers a real challenge followed by explicit equipment use.
- The persisted Main 1-7 run proves the same architecture across 20 decisions, including failure, explicit preparation, an optional branch, retry, and continued progression.
- More enemy concepts must be added from visible evidence, not internal role mappings.
- New-concept candidates are tracked, but accepting or rejecting them is not yet a dedicated AI cognition call.
