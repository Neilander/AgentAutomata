# UFS revision 1 vs fresh paired control V21

This experiment measures whether V20's captured personal feedback changes later prediction and
choice. It is not a replay of an old experimental branch.

## Arms

- `treatment`: an exact frozen copy of player `ufs-v20-fresh-player` at revision 1. Its next run is
  episode 2 and begins with 54 learned trajectories, 9 reinforced connections, and 189 prediction
  ledger entries.
- `control`: a new independent player `ufs-v21-fresh-control-player` at revision 0. It shares the
  same frozen initial template and attention seed, but begins with no personal learning.

Profiles, state directories, payloads, evidence, decisions, and later capture targets remain
separate. Never fork the control from the treatment and never merge either profile.

## Current boundary

Both arms completed exactly three rounds and are frozen before the Round 4 roll. The paired audit
found no public-view, submitted-choice, or random-observation divergence. Do not submit the Round 4
roll unless a later protocol explicitly extends this same experiment.

See `EXPERIMENT_PROTOCOL.md` for the comparison contract and `pair-manifest.json` for frozen IDs,
seeds, and source provenance. See `STAGE1_RESULTS.md` for the bounded learning-effect conclusion.
