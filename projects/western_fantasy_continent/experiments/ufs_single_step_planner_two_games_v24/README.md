# UFS V24: two consecutive single-step-planner games

This bounded experiment tests the single-step multi-candidate planner before any multi-step search
is added. It starts from the real V22 learned revision-7 profile, plays one full terminal episode,
captures the newly corrected scalar feedback as revision 8, then plays a second full episode from
revision 8 and captures revision 9.

Both games use the profile's fixed attention seed `2026082920` and the same keyed external random
tape. Every choice stores the complete read-only pre-choice plan before submitting its recommended
payload. The audit distinguishes GTE recall from an actual score adjustment and from an actual
choice change relative to the no-feedback baseline ranking.

Run or resume:

```powershell
node run-two-games.js
```

The script never overwrites existing profiles, payloads, plans or records. Completed games are
captured exactly once. See `attempt-02/RESULTS.json`, `attempt-02/AUDIT.json` and `RESULTS.md`.

The original unnumbered `states/`, `records/` and `profiles/` directories are a preserved failed
Attempt 1. It exposed two pre-existing boundary bugs before a valid comparison could begin: a
formal spawn choice missing from the cognitive fork and stale previous-round placements being
merged back after `submit_round_roll`. Both are fixed and covered by regressions. The valid run is
stored under `attempt-02/`.

`run-fixed-baseline.js` runs the historical fixed controller with the same attention seed and keyed
random tape. It uses the same frozen cognition but no private learned profile because the old
controller did not consult private feedback when choosing. This isolates the policy difference.
