# Token-Efficient Player Agent Loop V2

## Runtime Contract

The full player state remains code-owned and persistent. Decision calls reuse one logical player-Agent session, but conversation memory is advisory rather than authoritative.

```text
real game events
-> concept interpretation
-> full persistent knowledge store
-> decision point
-> explicit knowledge retrieval
-> compact decision request
-> same persistent Agent chooses one legal action
```

`persistent-agent-context.js` gives every run a stable Agent session id. The first request is marked `bootstrap`; later decision and attribution calls are marked `continue` with monotonically increasing turn numbers. A serialized game session restores the same id and turn count. The caller should route all turns with that id to the same Agent when its API supports persistent conversations.

This does not move game state, knowledge, emotion, legal actions, or evidence into model memory. If the provider loses the conversation, the repository request is still sufficient to continue correctly.

The retrieval node uses current goals, visible/available nodes, field rules, active and reserve roles, inventory, unresolved failures, pending hypotheses, and recently changed knowledge. It returns at most 18 compact beliefs under an 18 KB knowledge budget where possible.

Every request includes an audit containing the retrieval query, selected rows and scores, top rejected rows, required semantic checks, byte reduction, and any missed required knowledge. The full knowledge store is never pruned by retrieval.

## Validation

`validate-knowledge-retrieval-slices.js` replays ten real decision slices from the accepted Chapter 1 and Chapter 2 Agent sessions.

- 10 slices passed.
- 14/14 manually defined decision-critical knowledge checks were retained.
- No observation, legal action, emotion value, or full knowledge row was changed.
- Average full-request reduction was 73.26%.
- Mature decision points reduced by roughly 78% to 86%.
- Chapter 2 boss request reduced from about 246 KB to 39 KB.
- The first loot decision reduced by only 10.72% because the store contained only 12 rows; retaining nearly all early evidence is intentional.
- The persistence protocol passed bootstrap -> continue, JSON save/restore, and legacy-session upgrade checks.

Evidence: `knowledge_retrieval_validation/2026-07-15_v2/slice-results.json`.

## Known Follow-Up

Attribution is still requested after every action. A later V2 step may gate attribution to failures, surprises, hypothesis settlement, concept conflicts, and interruptions. That optimization is not included here because it changes API cadence and needs a separate causal regression.
