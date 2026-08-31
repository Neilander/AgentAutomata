# Agent Handoff: UFS learned-trajectory activation benchmark

- Date: 2026-08-30
- Agent/thread: root / codex/simulate-player-next
- Scope: frozen real-player personal-GTE retrieval benchmark across exact, paraphrased, convergent, noisy and negative situations
- Status: complete; benchmark failed and planner integration remains intentionally blocked

## User Intent

Use trajectories the player actually learned, construct multiple comparable situations, and test whether current-state/knowledge cues reliably awaken the right memories before using this mechanism for multi-step planning.

## Completed

- Froze V24 attempt 02 revision 9 with 275/275 real compiled personal trajectories and a fresh ownership control with zero personal trajectories.
- Selected six real target trajectories and six close confusers covering incomplete/complete energy rooms, zero-budget research, mothership descent, damage and free tunnel resolution.
- Recorded three controlled Agent cue passes per situation. Every cue cites supplied knowledge IDs and exact public-state paths; target IDs are isolated in a separate oracle.
- Added a precompiled-vector cognitive-field API so 108 cue vectors can be encoded in one real GTE batch without changing per-cue convergence behavior.
- Allowed the cognitive-field API to query the whole personal store when no context is supplied, while preserving the existing formal `query(q)` context-gated behavior.
- Ran 60 learned-profile cases plus 60 empty-fresh ownership checks. The frozen benchmark failed: paraphrased Hit@3 was 16/36, first combined pass was 4/6 Top-3, stability was 2/6, and near-miss false Top-3 was 2/6.
- Preserved the original exact target-ID failure at 11/12 and added a non-frozen equivalence diagnostic. The one miss was one of ten identical Q-before rows; exact endpoint equivalence was 12/12.
- Added an explicitly oracle-leaking context upper-bound diagnostic. Full stored applicability raised paraphrased results to 36/36 Top-3 and pass-1 combined to 6/6 Top-1, locating the dominant failure in unfiltered contextual competition rather than proving a deployable solution.
- Documented noise collapse, bad cue addition and missing abstention. No planner integration or player mutation was performed.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/player-feedback-gte.js`: nullable global vector-query context for read-only cognitive activation and following-endpoint vector retrieval.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/ufs-cognitive-field-activation.js`: reusable precompiled-vector activation entry point.
- `projects/western_fantasy_continent/experiments/ufs_first_action_imagination_v0/test-cognitive-field-activation.js`: global-context and precompiled-vector regressions.
- `projects/western_fantasy_continent/experiments/ufs_cognitive_field_activation_benchmark_v1/`: frozen protocol, separated oracle/input fixtures, three cue passes, runner and results.
- `coop_repo/LATEST.md`: new handoff entry.

## Validation

- Real benchmark: completed with local `gte-multilingual-base`; 275 rows, 108 query vectors, 0 grounding errors.
- Focused cognitive-field tests: 4/4 passed.
- Full UFS suite: 16 files, 156/156 passed.
- Fresh ownership invariant: zero personal trajectories and no personal GTE overlay.
- Frozen learned and fresh profiles were read-only and unchanged.
- `git diff --check`: passed; only existing Windows line-ending warnings.

## Current State

The experiment establishes a useful but insufficient activation signal. Distinctive learned outcomes such as zero-yield research and free tunnel resolution are stable, and exact endpoint meaning is preserved. However, the current global pool mixes many nearly identical contextual memories; equal addition of cue kinds can bury a strong Q-after match; unrelated queries always awaken something above 0.55; and free-form rephrasing is unstable. This is not ready to choose planner candidates.

The oracle-context upper bound is diagnostic only. A real player must construct partial context solely from noticed public state and owned knowledge, with no target trajectory leakage.

## Unresolved

- Derive a compact runtime retrieval context from noticed state without requiring exact full applicability.
- Decide hard versus soft/staged context gating and validate that it retains useful analogy transfer.
- Replace unconditional cue-kind addition with weighting, conflict handling or evidence selection.
- Add a calibrated abstention rule using margin/consistency, not only a raw cosine threshold.
- Rerun the frozen benchmark before connecting retrieval to temporal-unit expansion or live choice.
- The fresh fixture is an ownership-isolation control only; it does not compare against a separate initial rulebook GTE.

## Recommended Next Step

Implement an isolated context-aware activation V1 that derives partial applicability from each benchmark's public noticed state, then rerun the unchanged protocol with a context ablation and cue-weighting ablation. Do not start multi-step planner integration until the primary paraphrase, near-miss, stability and abstention failures are resolved.

