# Agent Handoff: UFS structured-relation multi-step activation

- Date: 2026-08-30
- Agent/thread: root / codex/simulate-player-next
- Scope: test Q-before, ordered operations and Q-after activation for an assumed-learned multi-step trajectory without episode IDs
- Status: controlled representation test complete; rank stabilized but similarity margin remains unsafe

## User Intent

Keep the work anchored on one of the five feedback-learning problems: an already learned multi-step trajectory must be correctly awakened through Q-before, the operation combination and Q-after. Resolve activation accuracy before post-activation filtering.

## Completed

- Audited the real revision-9 player and found all 275 historical trajectories have zero explicit operations, so they cannot honestly test multi-step combination recall.
- Built a controlled already-learned bank with correct two-step research, zero advance, reverse operation order and energy-room confusers; excluded all episode-specific IDs.
- Compared natural-language endpoints, natural language plus operations and canonical typed relations plus operations.
- Compiled 54 vectors in one real local GTE batch and recorded independent Q-before, Q-after and joint rankings plus their Top-2 union.
- Typed relations plus ordered operations returned the expected memory at joint rank 1 for three target paraphrases, reverse-order query and zero-advance query. Target paraphrases were stable at Q-before rank 1 / Q-after rank 2 / joint rank 1.
- Demonstrated why three routes are necessary: Q-after cannot distinguish correct versus reversed sequences with identical endpoints, while Q-before plus operations can.
- Measured the critical weakness: correct typed joint similarity `1.0` versus reverse `0.999775` and zero-advance `0.998389`. Rank success relies on exact canonical extraction and is not a robust semantic margin.
- Did not modify the runtime merger or add post-activation filtering.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_structured_relation_activation_v0/PROTOCOL.md`: frozen purpose, ablation and checks.
- `projects/western_fantasy_continent/experiments/ufs_structured_relation_activation_v0/fixture.json`: no-ID multi-step memory/query bank.
- `projects/western_fantasy_continent/experiments/ufs_structured_relation_activation_v0/run-structured-relation.js`: real-GTE three-route runner.
- `projects/western_fantasy_continent/experiments/ufs_structured_relation_activation_v0/RESULTS.md`: rankings, margins and limits.
- `coop_repo/LATEST.md`: new handoff entry.

## Validation

- Real local GTE: four candidates, five queries, three representations, 54 vectors.
- Frozen typed checks: all passed.
- Expected memory present in every three-route Top-2 union.
- Fixture episode-ID scan: passed.
- Profiles and formal games remained read-only.
- Full UFS regression remains 156/156 from the immediately preceding runtime work; this unit changed no runtime source.
- `git diff --check`: passed with existing line-ending warnings only.

## Current State

The work remains on the intended multi-step-learning path. The test shows Q-before, operations and Q-after contain complementary evidence and a normalized structural representation can stabilize rank without memorizing episode IDs. It also shows that serializing typed relations as ordinary embedding text is too weak: sequence/value differences are nearly collinear.

The proposed retrieval architecture now has a clearer boundary: semantic GTE supplies fuzzy activation; a separate structured relation channel must contribute activation selectivity; Q-before, Q-after and joint leaders remain separate candidate classes. Post-activation validation is still a later stage.

## Unresolved

- Define a structured relation similarity/compatibility channel outside the prose embedding.
- Test margins under one-field omissions, numeric perturbations and partial observations.
- Decide how three route lists share candidate budgets without average-only suppression.
- Connect the representation to newly learned real trajectories; revision-9 historical rows cannot be retroactively claimed to contain operation sequences.
- Add post-activation validation only after activation margins are adequate.

## Recommended Next Step

Implement an isolated relation-channel ablation with explicit operation-order, object-role, phase and before/after comparisons, then combine it with the existing GTE similarity for ranking. Run partial-observation and one-field-error perturbations before changing the runtime cognitive-field merger.

