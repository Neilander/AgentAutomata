# Cognitive-field cue summarizer contract

The agent receives exactly one `scene` and one `knowledgeBase` from
`scenario-and-knowledge.json`. It must not use outside UFS knowledge.

Return at most six cues. Every cue must contain:

- `cueId` and `kind`;
- `channel`: `before` for a present condition/affordance or `after` for a desired/feared result;
- `statement`: a short player-facing description;
- `statePaths`: the visible scene fields that support it;
- `knowledgeIds`: the supplied knowledge facts needed to interpret those fields;
- `q`: a complete five-slot semantic query.

Also return:

- `operationHints`: only when the supplied knowledge explicitly supports the operation or sequence;
- `unknowns`: visible objects whose use or importance cannot be derived from the supplied knowledge.

Rules:

1. A low or high numeric track is not automatically a need. A rule must establish why it matters.
2. A visible room name is not enough to invent its mechanism.
3. Do not turn a goal into a method unless the knowledge base contains their connection.
4. Cite both state and knowledge for any inferred relevance.
5. The output is recall input, not an action value or recommendation.
