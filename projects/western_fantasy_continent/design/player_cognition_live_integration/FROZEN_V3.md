# Frozen Player Cognition V3

Frozen at: 2026-07-13 06:21 CST

Status: the reopened character-affordance Phase 1 gate passed. This version adds a bounded, voluntary new-character experiment without changing Frozen V2.

## Strictly Frozen

| File | SHA-256 |
|---|---|
| `game_data/player-cognition-v3-event-runtime.js` | `DE0387520A83B111CDDC5A5C7ADC93BDFDC3A00223033FE31277F2B1440009B3` |
| `game_data/player-cognition-v3-action-policy.js` | `5DAADE4F185EA2A9822FDDC5F1FAB3B1B3E43E25F61EDDFE7FC4499CB30D5673` |
| `game_data/map-cognition-v3-event-adapter.js` | `725CE1BA18F223347B63C7E14E7FA9C4084C7B2627C1D60C9483B11B64FE2387` |

Do not change these files during gameplay A/B. A further cognition-model change creates V4, reopens Phase 1, and requires new causal controls plus independent acceptance.

## V3 Character-Affordance Contract

- Only a visible character-unlock signal creates a new-character experiment.
- An old reserve character without fresh unlock evidence receives no novelty experiment.
- A newly visible full character may voluntarily replace a visible militia member; no forced swap is injected.
- Only one team experiment can be active. While one experiment awaits combat evidence, another swap experiment cannot start.
- Blocked swaps are removed from the choice set; if no verification action is visible, the model waits instead of selecting a least-negative swap.
- The swap itself cannot confirm or refute the combat hypothesis.
- The following real combat must provide visible damage, healing, shielding, or skill-use evidence from that character.
- Hidden aggregate contribution data cannot verify the hypothesis.
- Terminal conclusion waits for an available or awaiting meaningful experiment, then releases after resolution.

## Accepted Controls

- Visible Ranger unlock creates one experiment and selects a militia-replacement swap over the ordinary available challenge.
- Hidden Ranger unlock creates no experiment.
- An old visible Ranger in reserve without unlock evidence does not receive novelty priority.
- Swap action settlement leaves the combat hypothesis pending.
- Ranger contribution from visible combat signals confirms the independent hypothesis and resolves the experiment.
- Hidden aggregate contribution with no visible signals cannot confirm it.
- A combat boundary with no visible contribution explicitly refutes the hypothesis instead of leaving hidden pending state.
- Ranger plus Assassin simultaneous unlock: one swap is followed by combat before any second swap.
- Five real full-region seeds: exactly one Ranger swap, Ranger remains active, experiment resolves, and the route terminates.
- V2 long-horizon, V1 event, and formal first-region regressions remain green.
- Two independent reviewers: ACCEPT / ACCEPT.

## Parameter Record

V3 adds provisional decision weights for a fresh visible character experiment: novelty `0.68`, visible militia replacement `0.12`, and low action cost `0.05`. These are behavior-policy constants used to make a visible low-cost experiment possible; they were not tuned to maximize emotion. Gameplay A/B must keep them frozen.
