# UFS cognitive-field activation V0

This isolated experiment tests two questions before cognitive-field recall is connected to the formal planner:

1. Can present-state cues and desired-result cues converge on one rulebook-provided two-operation research trajectory?
2. Can a knowledge-bounded agent summarize materially different cues from the same public scene when its supplied knowledge changes?

The experiment deliberately assumes the two-step rule is already known from a rulebook. It does not infer causal units from experience.

Files:

- `scenario-and-knowledge.json`: one fixed scene and three knowledge-base ablations;
- `CUE_SUMMARIZER_CONTRACT.md`: evidence-bounded agent output contract;
- `agent-cue-summaries.json`: one controlled root-agent pass for each knowledge base;
- `run-real-gte.js`: compiles the known two-step transition and all cues with the real local `gte-multilingual-base`, then performs before/after activation. The trajectory index is intentionally held fixed across the three cue sets so the diagnostic isolates how changed summarized cues alter the activation route; a deployed player must additionally restrict the index to knowledge it actually owns.

Run:

```powershell
node projects/western_fantasy_continent/experiments/ufs_cognitive_field_activation_v0/run-real-gte.js
```

The activation result is recall relevance only. It is not an action score and is not connected to the live player controller in V0.
