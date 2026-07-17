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
- `knowledge-retrieval.js`: explicit decision-time retrieval over the full persistent knowledge store.
- `../entity_impression_knowledge_v1/entity-impression-model.js`: code-owned character impression state, contextual observation memory, and trait revalidation.
- `../entity_impression_knowledge_v1/strength-cognition-matrix.js`: global character positions and the live top-30-percent relative ruler.
- `roster-change-expectation.js`: exact-roster failure scope and per-legal-swap counterfactual expectation.
- `roster-expectation-a.js`: freezes the Agent-selected roster prediction and settles its code-owned A once on the next comparable combat.
- `TOKEN_EFFICIENT_LOOP_V2.md`: persistent-Agent, short-context decision contract and real-slice validation.
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
-> code updates character impressions and the shared relative-strength ruler
-> code stores the exact-roster result and re-estimates each legal roster change
-> code asks AI for evidence-bound attribution
-> attribution is attached to learned knowledge
-> next decision cycle
```

The AI is an API dependency at two boundaries only. Calls from one playthrough carry a stable Agent session id and should reuse the same Agent. Code still retrieves a compact view from the persistent knowledge store before each decision, so conversation memory never becomes the source of truth.

1. `decision`: choose one allowed behavior using current observations and knowledge.
2. `attribution`: explain an observed result using semantic event IDs and learned knowledge.

The AI must not directly set emotion, PQRA, Agency, power, drops, knowledge, or game results.

Character impressions live in the same persistent player session, but remain a separate knowledge family from causal subject-environment-behavior-result rows. After each visible battle, code updates all participating character positions together from pairwise perceived differences, rebuilds the ruler whose zero is the weakest member of the current top 30%, and includes compact current impressions in the next decision request. AI wording never performs or overrides this calculation.

Roster expectations also live in the session. A failure is scoped to its encounter, exact team fingerprint, equipped build, and comparable current cognition. A different legal swap first checks exact history for that candidate team; otherwise code re-estimates it from incoming-versus-outgoing character position and context-relevant known traits. Missing character evidence returns unknown rather than inheriting a generic `swaps fail` belief. Material context-relevant trait revision invalidates an old exact-roster interpretation, and equal equipment score with a different build does not reuse the old baseline. The current cognition-to-performance mapping is provisional and exposed in the request audit.

The selected swap prediction has a separate persisted expectation ledger. At selection time code freezes the visible baseline, selected predicted combat score, target encounter, candidate team/build, persistent perception profile, and prediction confidence. On settlement, code converts both expected and actual relative improvement to that profile's semantic level and applies the asymmetric mismatch curve. Confirmation `C` uses a separate self-serving geometric curve over visible actual-versus-expected combat progress: success at or above expectation grows with `ratio^0.5`; a slightly lower result inside the same perceived band decays with `ratio^1.5`; any downward perceived-band crossing is clear disconfirmation and forces `C = 0`; the positive multiplier is capped at `2`. The base constant remains `0.1` and is further scaled by effective confidence, signal clarity, and goal importance. Direct combat result `R` remains separate.

An explicit equipment change no longer invalidates the pending roster prediction. Code recalculates it from `base cognition strength * equipment multiplier`, records base strength, multiplier, effective strength, and before/after predicted score, then keeps the prediction awaiting combat. A naturally selected different encounter also no longer discards the prediction: it keeps the inherited expected strength unchanged while multiplying confidence by `0.25`. For example, expected strength `5` remains `5`, while source confidence `0.7` becomes effective confidence `0.175`. Explicit visible Boss or trial/field-rule signals can replace the inherited expectation and use confidence weight `0.7`. A genuinely different team still invalidates the record, and a later swap still supersedes it. Agent instructions neither calculate nor choose A or C.

The first Agent request is marked `bootstrap`; subsequent decision and attribution requests are marked `continue`. The id and completed turn count survive JSON save/restore. If the provider loses the persistent conversation, the code-owned session remains sufficient to continue.

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
- four visible squad characters enter the persistent impression matrix and the next decision request receives their code-owned current relative levels.

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
- Character-ruler eligibility currently means at least one accepted battle observation; time-based stale-data invalidation is not implemented yet.
- Roster prediction coefficients are ordinal V1 hypotheses, not calibrated win probabilities; exact team history should replace counterfactual estimates as evidence arrives.
- Roster prediction currently handles successive one-slot swaps. Simultaneous multi-slot changes and richer armor/formation/control-immunity contexts are not modeled yet.
- Positive improvement bands are implemented for roster A. Negative deterioration remains deliberately clipped to the level-zero positive-improvement contract until separate deterioration bands are designed.
- Confirmation constant `0.1`, geometric powers `0.5/1.5`, confirmation multiplier cap `2`, new-encounter inertia weight `0.25`, strong-signal threshold `0.7`, and strong-signal weight `0.7` are provisional program constants validated only by deterministic precision tests.
