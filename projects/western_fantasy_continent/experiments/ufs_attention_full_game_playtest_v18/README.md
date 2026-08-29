# UFS fresh-player prediction-learning playtest V18

This is the first live strategy playtest using the isolated player-profile flow.

- Player profile: `player-v18-fresh.json`
- Player id: `ufs-v18-fresh-player`
- Attempt/state: `state_attempt_2026082918_v18`
- Attention seed: `2026082918`
- Stage 1: stop after three completed rounds at the Round 4 random boundary.
- Stage 2: continue the same attempt only after the three-round gate passes; stop at a formal win/loss outcome.
- Every deliberate operation should include 1-3 honest prediction tickets when the public view and learned rules support a prediction.
- Use only `record-public-step.js`; never reuse V16/V17 state, payloads, decisions, or hidden audit data.

