# UFS fresh-player prediction-learning playtest V20

This is the first live strategy playtest using the isolated player-profile flow.

- Player profile: `player-v20-fresh.json`
- Player id: `ufs-v20-fresh-player`
- Attempt/state: `state_attempt_2026082920_v20`
- Attention seed: `2026082920`
- Stage 1: stop after three completed rounds at the Round 4 random boundary.
- Stage 2: continue the same attempt only after the three-round gate passes; stop at a formal win/loss outcome.
- Every deliberate operation should include 1-3 honest prediction tickets when the public view and learned rules support a prediction.
- Use only `record-public-step.js`; never reuse V16-V19 state, payloads, decisions, or hidden audit data.
