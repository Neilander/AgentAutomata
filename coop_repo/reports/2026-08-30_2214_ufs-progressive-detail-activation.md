# Agent Handoff: UFS progressive-detail activation

- Date: 2026-08-30
- Agent/thread: root / codex/simulate-player-next
- Scope: isolate whether added true situation detail monotonically improves recall of one real learned energy-room trajectory
- Status: complete read-only diagnostic; coarse checks passed but relational detail was unstable

## User Intent

Verify the expectation that a sufficiently detailed description should awaken the correct learned memory even when semantically similar memories are activated together. Keep this separate from the Q-before/Q-after merger change.

## Completed

- Froze revision 9 target `feedback-trajectory-00162` and close first-cell confuser `feedback-trajectory-00128` from the 275/275 compiled personal GTE store.
- Defined five cumulative detail levels independently for Q-before and Q-after: generic family, two-cell structure, second investment plus occupancy `1→2`, delayed reward, then visible identifiers/operation/phase.
- Added exact stored endpoints as non-scored ceiling diagnostics.
- Ran all 12 queries in one real GTE batch without applicability filtering.
- Confirmed fully detailed cues retrieve the target at rank 3 from Q-before and rank 2 from Q-after; exact endpoints rank 1.
- Found non-monotonic relational behavior: Q-before fell `14→118` when the crucial second-investment/`1→2` detail was added and recovered only after exact identifiers; Q-after moved `14→3→6→2`.
- Preserved the user's separate merger design: future recall should union Q-before leaders, Q-after leaders and joint leaders rather than retain only average winners. No merger code was changed in this diagnostic.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_cognitive_field_progressive_detail_v0/PROTOCOL.md`: frozen question, fixture and checks.
- `projects/western_fantasy_continent/experiments/ufs_cognitive_field_progressive_detail_v0/progressive-cues.json`: cumulative before/after cues.
- `projects/western_fantasy_continent/experiments/ufs_cognitive_field_progressive_detail_v0/run-progressive-detail.js`: real-GTE read-only runner.
- `projects/western_fantasy_continent/experiments/ufs_cognitive_field_progressive_detail_v0/RESULTS.md`: measured ranks and interpretation.
- `coop_repo/LATEST.md`: new handoff entry.

## Validation

- Real local GTE run completed against 275 trajectories and 12 query vectors.
- Both channels passed the preregistered coarse checks.
- Exact Q-before and Q-after each returned the target at rank 1.
- Profiles remained read-only; no formal action or capture occurred.
- Full UFS suite earlier in the same work unit: 156/156 passed; only isolated experiment files were added afterward.
- `git diff --check`: passed with existing line-ending warnings only.

## Current State

The result supports broad semantic activation plus later qualification, but not the stronger claim that adding natural-language relational detail produces monotonic recall. The final detailed scene works, while the desired transferable relation `second investment / 1→2` is much less reliable than exact die/cell/action tokens. This points to a representation alignment issue: important state relations exist in public state/applicability but are not guaranteed to dominate the five-slot embedding.

## Unresolved

- Test structured relational cues without episode-specific IDs to distinguish real relation understanding from identifier shortcuts.
- Define the three-route candidate union for Q-before, Q-after and joint similarity.
- Later add post-activation condition validation and abstention as the user proposed.
- Replicate progressive detail on damage and research cases before claiming generality.

## Recommended Next Step

Create one small representation ablation for the same frozen target: semantic Q only versus semantic Q plus typed `operation/phase/object/before/after` relations, while removing exact die and cell IDs. If typed relations move the target above the first-cell confuser, use those relations both for candidate qualification and the later validation stage.

