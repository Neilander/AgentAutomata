# Agent Handoff: UFS V21 revision 1 vs fresh three-round result

- Date: 2026-08-29 13:38 Asia/Shanghai
- Agent/thread: root / `codex/simulate-player-next`
- Scope: matched three-round learning-effect comparison
- Status: complete

## User Intent

Play both the V20 revision 1 player and a completely fresh isolated control for three rounds under
comparable attention and randomness, then determine whether captured feedback changes prediction
or choice.

## Completed

- Played both arms in alternating paired steps using the same attention seed and precommitted
  random observations.
- Stopped both exactly before the Round 4 roll; no fourth-round randomness was consumed.
- Preserved strict profile/state/evidence isolation between treatment and control.
- Verified identical public observations, exact submitted choices, and exact paired randomness.
- Audited target hazards and post-stage private learning state.
- Recorded the bounded conclusion: captured learning persisted, but caused no measurable behavioral
  advantage in these three rounds.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_revision1_vs_fresh_control_v21/records/`: 41 public evidence records and decision logs per arm.
- `projects/western_fantasy_continent/experiments/ufs_revision1_vs_fresh_control_v21/states/`: isolated checkpoints after three rounds.
- `projects/western_fantasy_continent/experiments/ufs_revision1_vs_fresh_control_v21/STAGE1_RESULTS.md`: result and learning-state audit.
- `projects/western_fantasy_continent/experiments/ufs_revision1_vs_fresh_control_v21/COMPARISON_LOG.md`: five requested comparison categories.
- `projects/western_fantasy_continent/experiments/ufs_revision1_vs_fresh_control_v21/pair-manifest.json`: stage marked complete.
- `coop_repo/LATEST.md`: latest handoff entry.

## Validation

- `node .../verify-paired-stage1.js`: passed; both gates true, 41 records per arm, 35/35 deliberate predictions, 0 rejected, 0 behavioral divergences.
- Both restored hosts: Round 3/new-round, energy 4, damage 0, research 1, excavator 0, mothership 3, no outcome.
- Full UFS regression: 14 suites, 137/137 tests passed.
- `git diff --check`: passed; only existing LF-to-CRLF conversion warnings were emitted.

## Current State

Treatment still contains the V20 personal overlay (54 input trajectories, nine connection updates,
189 prior ledger entries); control began empty. During this stage each arm added the same 29
trajectories and 64 ledger entries with the same 37/1/22/4 status distribution. Neither arm
automatically activated a `feedback-*` trajectory. Thus storage and isolation work, but active use
of learned feedback remains unproved.

## Unresolved

- Zero-energy and research-rollback target states did not occur, so this sample cannot compare them.
- Learned feedback trajectories still report `pending_matrix_compile`; the observed null effect is
  consistent with, but does not by itself prove, that activation gap.
- One prediction timing mismatch occurred equally in both arms: research energy was charged at room
  resolution rather than at the later advance-choice boundary.

## Recommended Next Step

Wire learned `feedback-*` trajectories into the active GTE/activation path and rerun this paired
protocol. Add targeted paired fixtures for guaranteed zero-energy and research-rollback exposure
instead of relying on another blind long game.
