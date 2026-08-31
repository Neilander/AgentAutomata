# UFS learned player: five consecutive full games V22

This experiment starts from the exact V20 revision-1 profile and plays five new, isolated,
terminal episodes.  Each episode is captured exactly once into a new profile revision, and the next
episode starts from that captured output.  Game 1 and Game 5 use the same attention seed and the
same keyed replayable random tape.

The experiment asks three separate questions:

1. Was personal learning saved across all five revision transitions?
2. Did any stored `feedback-*` trajectory enter the actual prediction/decision path?
3. Did Game 5 improve over Game 1 on the preregistered outcome and process measures?

See `PROTOCOL.md` for the frozen contract, `RESULTS.md` for the completed comparison, and
`AGENT_REPORT.md` for the detailed audit narrative.

Repeat the read-only final audit with:

```powershell
node audit-five-games.js
```

Expected result: `passed: true`, five terminal games, revisions `1..5 → 2..6`, one capture per
game, and `game5ImprovedOverGame1: false`.
