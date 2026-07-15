# Current Compact State

- Frozen V3 cognition, PQRA, emotion parameters, formal skills, and formal base values remain unchanged.
- Chapter 1 accepted core: `map-progression-cognition-core-phase2-midlock.js`.
- Chapter 2 accepted core: `map-progression-chapter2-core.js`; two rescue lanes cross-key the shield and king-flag trials, then teach equipment level and Epic fit.
- Player-Agent decisions now use `player_decision_request_v2` and `knowledge-retrieval.js`.
- Each run now carries a stable persistent Agent session id; the first call is `bootstrap`, later calls are `continue`, and JSON restoration preserves continuity.
- The full canonical knowledge store remains in the session; only up to 18 relevant summaries enter each decision call.
- Ten real Chapter 1/2 slices passed all 14 critical-knowledge checks. Average request reduction: 73.26%.
- Existing causal, Chapter 2 signal, hypothesis, and Chapter 2 lock-key tests pass.
- Human-playable Chapter 1+2 map V4 is available at `/map_progression_lab/campaign-v4.html`; direct Chapter 2 testing uses `?chapter=2`.
- V4 separates map, roster, equipment, and battle pages, uses real BattleView settlement, and requires explicit manual equipment.
- Known limitation: Chapter 1 Main 1 visually plays the opening group while the accepted core settles the complete multi-wave encounter.
