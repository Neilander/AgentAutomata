# UFS automatic multi-cutpoint live gate V2

This experiment is the first live controller run in which every non-random action is preceded by the integrated automatic sequential-Q imagination path.

The controller receives only the current player response. It derives a macro intent, creates at most three intent/environment-anchored candidates, and calls `UfsFullGameAttentionSession.imagineSequentialPlan()` for each candidate. It executes only the first newly imagined operation, then discards the suffix and regenerates from the next Q. It never supplies a predicted intermediate Q.

White-die rerolls are real stopping boundaries. The selected plan returns `paused_random`; an isolated deterministic live random provider supplies exactly the public pending keys; the old suffix is recorded as discarded; the same macro intent then generates new candidates from the observed Q.

The experiment first evaluates round 1 as a hard gate. Because round 1 passed every assertion, the same player and host continued through rounds 2 and 3. All three rounds reached `waiting_for_next_round_roll` without rejected operations.

Run:

```powershell
node run-experiment.js
node verify-evidence.js
node --test test-controller.js
```

Evidence:

- `evidence/machine-replay.json`: every visible Q, cutpoint, candidate input, automatic Q trace, selected first action, random pause/replan and boundary audit.
- `evidence/final-host-checkpoint.json`: recoverable host/player checkpoint at the round-3 boundary.
- `RESULTS.md`: concise interpretation and limitations.

The controller is an isolated experimental controller. It does not replace the default `planCurrentChoice()` and does not change the player initializer or frozen player assets.
