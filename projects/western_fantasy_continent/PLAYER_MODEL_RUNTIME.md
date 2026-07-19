# Executable Player Model Runtime

This is the durable entry point for the currently executable AI playtest loop. Future agents must use this document instead of reconstructing the architecture from chat history or old reports.

## Frozen Information Presentation Contract

Battle frontend and player-information parsing share `information_presentation_tier_v2`. It keeps a `background=0.25` floor, then uses a continuous main-interface ladder: `ambient=0.40`, `standard_low=0.50`, `standard=0.60`, `standard_high=0.70`, `prominent=0.80`, `highlight=0.90`, and forced `blocking=1.00`. The values are frozen presentation-evidence strengths, not direct reception probabilities.

This replaces fine-grained cognitive scoring from font pixels, color coefficients, and animation duration. Event salience, relative magnitude, player goal, attention competition, repetition, and perception profile remain separate. Human-facing implementation rules and calibration evidence are in `design/INFORMATION_PRESENTATION_TIER_CONTRACT.md`.

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
- `game_data/player-feedback-model.js`: code-owned feedback boundary for Process, R, A, and EVerify outputs.
- `TOKEN_EFFICIENT_LOOP_V2.md`: persistent-Agent, short-context decision contract and real-slice validation.
- `causal_verification_v9_concept_interpreter/`: current accepted two-cycle evidence session and summaries.
- `real_main7_run_2026-07-13_170746/`: fresh Main 1-7 evidence session, learning delta, and audit. Large per-turn request/response transcripts are retained locally under `.local_run_archive/player_agent_api_loop_v1/` rather than in Git.

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

Decision hypotheses use one measurable-condition field named `targetCondition`, shaped as `{ metric, operator, value }`. It is required for `verificationScope: "next_combat"` and optional with the same shape for `current_action`. Full and compact requests expose the identical contract. The rejected historical alias `nextCombatTargetCondition` is not accepted; runtime errors point the caller to `targetCondition`. Code persists the normalized condition and uses it for confirmed, refuted, or inconclusive verification.

Feedback is now emitted as a replaceable `player_feedback_bundle_v1` instead of being assembled inline by the event runtime. Its four independent channels are `process`, `R`, `A`, and `EVerify`. EVerify keeps five first-layer dimensions—signed support, evidence strength, causal contribution, novelty, and closure—and derives three auditable second-layer outputs: causal knowledge evidence, strategy satisfaction (`max(support, 0) * strength`), and discovery satisfaction (`novelty * strength * closure`). Strategy/discovery emotion scales remain provisional code constants. Confirmed and refuted comparisons may both count verification process, but only supported causation produces strategy satisfaction; refutation pulls the context-scoped causal belief downward, and inconclusive evidence does not update it. A single observation begins from symmetric prior mass and therefore cannot create full confidence.

Novelty and closure are deferred discovery-model inputs. Until a player-visible causal-chain parser provides explicit semantic evidence, both default to `0`; closure must never fall back to evidence strength. Therefore current formal runs produce no discovery satisfaction from ordinary target-condition verification.

The isolated resolver at `game_data/everify-isolated-v1.js` is now the `everify_causal_chain_isolated_v2` candidate. At decision time the Agent must provide a claim, its chosen behavior, and a causal chain of at least three explicit semantic steps; Agent-supplied support or strength is ignored. After combat, the resolver accepts only received step observations or explicit contradictions, their event times, and their existing `information_presentation_tier_v2` tiers. It derives every adjacent causal link itself. The whole claim receives support `+1` only when every link is observed in order, support `-1` when a link is explicitly contradicted or temporally reversed, and support `0` when the chain is incomplete. Confirmed earlier links remain separate local knowledge even when a later link fails. Full-chain positive strength uses the weakest visible link; refutation uses the explicit contradiction's tier strength. There are no mechanism/effect averaging weights, custom clarity numbers, or result-`R` input. This candidate is deliberately not wired into the formal runtime yet.

The decision request exposes summarized `causalKnowledge` in both full and compact forms. These rows are player beliefs learned from perceived hypothesis evidence, not game truth. Existing target-condition comparisons without richer causal evidence are explicitly marked `target_condition_proxy` and use an unknown-contribution weight; semantic evidence can later provide primary, joint, supporting, or irrelevant contribution plus competing-explanation strength.

Character impressions live in the same persistent player session, but remain a separate knowledge family from causal subject-environment-behavior-result rows. After each visible battle, code independently updates output, protection, and team-buff positions from pairwise perceived differences. Each capability owns its own ruler whose zero is the weakest member of that capability's current top 30%. A capability with no accepted visible evidence in that battle does not update. The next decision request exposes only these three rulers; code never creates a persistent overall character-strength score. The older composite matrix remains an internal compatibility surface for historical state and direct legacy regression. It is neither exposed as current character cognition nor used by the formal capability-mix swap prediction or its later equipment rebase.

Battle-local ally labels such as `left-2` are positions, not character identities. Before the character-impression model reads a battle, `stable-character-event-adapter.js` maps every visible friendly reference back to that battle roster's permanent character ID. The non-character information filter is a parallel branch and is prohibited from compressing, recalculating, or updating character impressions. Character cognition updates first; the filtered non-character branch then snapshots those updated cognition coordinates by actual formation slot and writes its causal rows through the existing canonical knowledge merger. The three-branch contract and 22-battle evidence are documented in `design/ISOLATED_PLAYER_COGNITION_COMPOSITION_V1.md`.

Roster expectations also live in the session. A failure is scoped to its encounter, exact team fingerprint, equipped build, and comparable current cognition. A different legal swap first checks exact history for that candidate team. Otherwise each counterfactual exposes independent output, protection, and buff deltas plus pure-axis scenarios, but withholds a final numeric prediction until the Agent describes the current problem as three coarse integer need weights from `0` to `10`. Code normalizes those weights, projects the weighted capability delta, adds only the existing context-relevant trait adjustment, and freezes the result. The mix is local to this decision and never becomes a permanent character score. If any positively weighted axis lacks cognition evidence, the prediction remains unknown rather than treating missing evidence as zero or falling back to the old composite matrix. Material context-relevant trait revision invalidates an old exact-roster interpretation, and equal equipment score with a different build does not reuse the old baseline.

The selected swap prediction has a separate persisted expectation ledger. At selection time code freezes the visible baseline, the Agent's normalized capability-need mix, weighted capability delta, context-trait adjustment, selected predicted combat score, target encounter, candidate team/build, persistent perception profile, and axis-evidence-adjusted prediction confidence. On settlement, code converts both expected and actual relative improvement to that profile's semantic level and applies the existing asymmetric mismatch curve. Confirmation `C` uses a separate self-serving geometric curve over visible actual-versus-expected combat progress: success at or above expectation grows with `ratio^0.5`; a slightly lower result inside the same perceived band decays with `ratio^1.5`; any downward perceived-band crossing is clear disconfirmation and forces `C = 0`; the positive multiplier is capped at `2`. The base constant remains `0.1` and is further scaled by effective confidence, signal clarity, and goal importance. Direct combat result `R` remains separate. Capability mixing changes the source of the expected score; it does not change A or C.

An explicit equipment change no longer invalidates the pending roster prediction. For a capability-mix prediction, code applies the equipment-power ratio to the already frozen mixed combat-progress prediction; it records the rebase basis, ratio, before/after progress, before/after score, and retained capability mix. This path never reopens the old composite strength. Direct legacy/exact compatibility records keep their previously accepted base-strength or progress fallback. A naturally selected different encounter also no longer discards the prediction: it keeps the inherited expected strength unchanged while multiplying confidence by `0.25`. For example, expected strength `5` remains `5`, while source confidence `0.7` becomes effective confidence `0.175`. Explicit visible Boss or trial/field-rule signals can replace the inherited expectation and use confidence weight `0.7`. A genuinely different team still invalidates the record, and a later swap still supersedes it. Agent instructions neither calculate nor choose A or C.

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

The non-character filter no longer treats received sentences as knowledge. It converts accepted evidence into the existing causal contract: `subject + environment + behavior -> structured result`, and the formal runtime now passes those rows through the existing canonical knowledge merger. Persistent interface facts—field rules, actual loot, map unlocks, and character unlocks—bypass stochastic attention loss. Character evidence is diverted before this branch, and probability opportunities remain in their dedicated ledger. Challenge attribution uses public semantic signal hashes rather than raw engine event IDs. Retrieved challenge knowledge exposes the historical formation, matrix positions, historical top-30-percent boundary, relative-to-boundary values, labels, and evidence counts in both full and compact Agent requests. The current contract, 22-battle audit, and controlled Agent ablation are in `design/TYPE1_FILTERED_CAUSAL_KNOWLEDGE_V1.md`.

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
- Capability rulers use visible contribution proxies. Protection requires attributable heal, shield, absorb/block, or prevented-damage evidence; buff currently means visible positive status applied to another ally. Pure damage-taking and hidden downstream buff value are not inferred.
- Agent capability-need weights are coarse ratio judgments, not ratings. Their `0–10` response granularity and the capability-to-performance coefficient are deterministic V1 hypotheses, not human-calibrated parameters.
- Capability-mix equipment rebasing currently uses the visible total equipment-power ratio on the frozen mixed combat-progress prediction. Equipment affixes are not yet decomposed into separate output, protection, and buff effects.
- Roster prediction coefficients are ordinal V1 hypotheses, not calibrated win probabilities; exact team history should replace counterfactual estimates as evidence arrives.
- Roster prediction currently handles successive one-slot swaps. Simultaneous multi-slot changes and richer armor/formation/control-immunity contexts are not modeled yet.
- Positive improvement bands are implemented for roster A. Negative deterioration remains deliberately clipped to the level-zero positive-improvement contract until separate deterioration bands are designed.
- Confirmation constant `0.1`, geometric powers `0.5/1.5`, confirmation multiplier cap `2`, new-encounter inertia weight `0.25`, strong-signal threshold `0.7`, and strong-signal weight `0.7` are provisional program constants validated only by deterministic precision tests.
