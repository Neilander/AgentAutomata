# Agent Handoff: Signal-Based UI And Life Recognition Model

- Date: 2026-06-25
- Agent/thread: Codex local desktop thread
- Scope: Western Fantasy Continent UI design automation, attention/signal modeling, and a first life-recognition simulator
- Status: partial, usable prototypes and docs exist, model still needs calibration

## User Intent

Today started from a concrete UI failure: the 4v4 genre arena and related game screens were hard to read, visually confusing, and frequently showed the wrong thing with the wrong priority.

The larger objective became:

Build a reusable design and player-simulation process so future agents do not merely "place data on a page", but first infer:

- what information the player needs,
- what behavior the player should take,
- what feedback the player should receive,
- what the core experience point is,
- what the player should not see,
- how attention is allocated across regions and controls,
- how signals become player emotions, satisfaction, achievement, agency, and next intent.

This is part of the broader AgentAutomata goal: make agents independently produce more reliable game/content outputs instead of requiring the user to manually correct every UI and design mistake.

## Completed

- Created a player signal simulation design document.
  - File: `projects/western_fantasy_continent/design/player-signal-simulation-system.md`
  - Defines the pipeline: intent -> signal emitter -> signal receiver -> signal analyzer.
  - Adds recursive attention allocation from page -> region -> panel -> list -> card -> element.
  - Adds z-layer / overlay attention rules for dropdowns, popovers, modals, and covered UI.
  - Adds bottom-up salience and top-down intent relevance instead of treating every visible thing as equally important.

- Built public website attention samples and annotation pages.
  - Directory: `projects/western_fantasy_continent/design/attention_samples/`
  - Includes raw and annotated screenshots for several public websites.
  - Purpose: check whether the attention model roughly matches human intuition before applying it to our own UI.

- Built formula-based attention analysis scripts and reports.
  - Files include:
    - `attention-samples.json`
    - `attention-analyzer.js`
    - `attention-analysis-report.md`
  - Early result: the model can roughly identify top attention clusters, but should not yet be treated as a precise UX metric.

- Built a 4v4 genre arena attention report.
  - Files:
    - `projects/western_fantasy_continent/design/genre-arena-attention-tree.json`
    - `projects/western_fantasy_continent/design/attention-tree-analyzer.js`
    - `projects/western_fantasy_continent/design/genre-arena-attention-report.md`
    - `projects/western_fantasy_continent/design/genre_arena_annotated.html`
  - Important finding: preset/team lists can consume large attention at the region level while each individual card remains unreadable because the attention is split too many ways.

- Created a new project skill: signal-based UI planner.
  - File: `projects/western_fantasy_continent/skills/signal-based-ui-planner/SKILL.md`
  - It is meant for complex/dense/novel game UI.
  - It requires agents to plan from intent, core object, hierarchy, attention budget, control choice, and z-layer before visual implementation.

- Updated the game UI skill routing.
  - File: `projects/western_fantasy_continent/skills/game-ui-designer/SKILL.md`
  - Also updated local global skill at `C:/Users/WYZ/.codex/skills/game-ui-designer/SKILL.md`
  - Rule: common/simple game screens can use `game-ui-designer`; complex/dense/multi-state screens should first use `signal-based-ui-planner`.

- Built two experimental 4v4 UI variants.
  - `projects/western_fantasy_continent/genre_arena_v2/`
  - `projects/western_fantasy_continent/genre_arena_v3/`
  - V2 exposed flaws: it simulated too much and did not preserve the actual combat experience.
  - V3 is better: left/right dropdowns select team presets, center embeds the existing real 4v4 battle body.
  - User judged V3 basically acceptable, but noted duplicate start controls and log visibility still need cleanup.

- Added server/workbench routes for the new UI prototypes.
  - File: `projects/western_fantasy_continent/app/server/server.js`
  - File: `projects/western_fantasy_continent/workbench/index.html`

- Developed the beginning of a signal analyzer theory.
  - Key concept: signal -> cognitive processing -> feedback.
  - Signals do not directly become emotion.
  - They are interpreted through player intent, expected outcome, agency, attribution, difficulty, and current internal state.

- Built a new standalone life recognition simulator.
  - Directory: `projects/western_fantasy_continent/life_simulator/`
  - Entry route: `/life_simulator/`
  - Player chooses 1 of 3 cards each turn.
  - Each card has success probability, agency, and recognition value.
  - Recognition formula:
    ```js
    eventRecognition = (1 / successRate) ^ x
    ```
  - The right side shows:
    - self recognition / self-worth baseline,
    - pleasure,
    - recent event interpretation,
    - event log.
  - This tests the user's idea that satisfaction and achievement are not separate currencies, but different interpretations of the same recognition event value.

- Documented the life recognition model.
  - File: `projects/western_fantasy_continent/design/life-recognition-simulator.md`

## Files Changed

- `projects/western_fantasy_continent/design/player-signal-simulation-system.md`: main signal/attention/player simulation theory.
- `projects/western_fantasy_continent/design/attention_samples/`: external UI screenshots, annotations, and attention analysis.
- `projects/western_fantasy_continent/design/genre-arena-attention-tree.json`: recursive page hierarchy for 4v4 attention analysis.
- `projects/western_fantasy_continent/design/genre-arena-attention-report.md`: 4v4 attention report.
- `projects/western_fantasy_continent/design/life-recognition-simulator.md`: compact model notes for the new simulator.
- `projects/western_fantasy_continent/skills/signal-based-ui-planner/SKILL.md`: new skill for complex UI planning.
- `projects/western_fantasy_continent/skills/game-ui-designer/SKILL.md`: updated routing to signal-based UI planning.
- `projects/western_fantasy_continent/skills/README.md`: added the new skill to the local skill list.
- `projects/western_fantasy_continent/genre_arena_v2/`: first signal-based 4v4 UI experiment.
- `projects/western_fantasy_continent/genre_arena_v3/`: improved 4v4 UI experiment that embeds the real battle body.
- `projects/western_fantasy_continent/life_simulator/`: new recognition/satisfaction/achievement simulator.
- `projects/western_fantasy_continent/app/server/server.js`: routes for V2, V3, life simulator.
- `projects/western_fantasy_continent/workbench/index.html`: workbench entries for new pages.

There are also unrelated dirty files in the worktree, especially `encounter_lab/*`. Do not assume they are part of this specific handoff without checking their own report/history.

## Validation

- `node --check projects/western_fantasy_continent/genre_arena_v3/genre-arena-v3.js`: passed earlier.
- `node --check projects/western_fantasy_continent/life_simulator/life-simulator.js`: passed.
- `node --check projects/western_fantasy_continent/app/server/server.js`: passed.
- User manually reviewed V3 and judged it acceptable but not final.
- User manually reviewed external attention annotations and judged them basically correct.

No server was started in the latest pass because the user said they will run the server themselves.

## Current State

The project now has three related layers:

1. `game-ui-designer`
   - Good for normal game UI patterns like inventory, combat HUD, team screens.

2. `signal-based-ui-planner`
   - Good for complex screens where agents must first decide player intent, information hierarchy, attention budget, and control choice.

3. Player signal / recognition model
   - Still early.
   - Intended to explain how UI/game signals become satisfaction, achievement, frustration, agency, next action, and long-term self-recognition.

The most important modeling decision today:

```text
satisfaction and achievement are not separate currencies.
They are different interpretations of:

eventRecognition - selfRecognitionBaseline
```

Low recognition events can create satisfaction when the player's self baseline is low or pleasure is depleted.
High recognition events can create achievement when they exceed the baseline and feel agency-driven.
High recognition failures can reduce both pleasure and self-recognition.

## Unresolved

- The recognition simulator is only a first playable model. Its numbers are not balanced.
- The formula `eventRecognition = (1 / successRate) ^ x` may need a cap, soft curve, or domain-specific scaling.
- Satisfaction, achievement, failure damage, and pleasure decay weights are rough.
- Agency is currently simple and manual per card.
- The model does not yet include:
  - player intent profiles,
  - domain-specific self-recognition baselines,
  - expectation adaptation,
  - repeated event habituation,
  - attribution clarity,
  - social comparison,
  - time pressure,
  - action cost,
  - recovery behaviors.
- 4v4 V3 still has UX cleanup work:
  - duplicate start controls,
  - logs are not prominent enough,
  - old page is embedded via iframe and hidden CSS, which is pragmatic but not architecturally clean.
- The attention model is useful as a design aid, but not yet a proven metric.

## Recommended Next Step

Start by reading:

1. `projects/western_fantasy_continent/design/player-signal-simulation-system.md`
2. `projects/western_fantasy_continent/design/life-recognition-simulator.md`
3. `projects/western_fantasy_continent/skills/signal-based-ui-planner/SKILL.md`
4. `projects/western_fantasy_continent/life_simulator/life-simulator.js`

Highest-value next work:

1. Calibrate the life recognition simulator.
   - Add multiple player profiles:
     - low self-recognition / high pleasure need,
     - high self-recognition / challenge-seeking,
     - fragile high self-recognition,
     - low pleasure / risk-avoidant.
   - Add event domains:
     - combat,
     - loot,
     - social,
     - creation,
     - mastery.
   - Let each domain have its own baseline instead of one global `selfWorth`.

2. Turn the recognition model into a reusable evaluator.
   - Input: game event + player intent + signal presentation.
   - Output: satisfaction, achievement, frustration, agency, next action bias.

3. Use the evaluator on a real game loop.
   - Suggested target: 4v4 genre arena or tower/farming loop.
   - Goal: predict whether the player sees progress, understands failure, and wants another run.

4. Clean up V3 4v4 UI only after the model is stable enough to guide decisions.
   - Avoid doing another purely visual redesign without first writing the intent/hierarchy/attention plan.

