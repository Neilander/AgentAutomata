# UFS V23 pre-choice planner result

Date: 2026-08-29

This is a bounded planning smoke test, not a full-game result. It compares the fresh revision-0
player with the real V22 learned revision-7 player under the same attention seed `2026082920`.
The comparison script never advances a plan itself and verifies that planning leaves the live
checkpoint unchanged.

## What changed

- A choice boundary now enumerates every candidate exposed by the public operation contracts.
- Each candidate runs in an isolated clone of the player's cognitive checkpoint to the next
  choice/random/stable boundary.
- The planner scores track deltas and terminal results, with explicit penalties for damage,
  mothership movement and entering zero energy.
- Novel candidate Qs are batch-encoded by the real local `gte-multilingual-base` before querying
  the private compiled feedback matrix.
- Only consequences reconstructed from player-visible, formally audited ledger evidence may
  change a candidate score.
- `full-game-attention-player-cli.js plan <state-dir>` is read-only and returns a directly
  submit-able payload with a prediction ticket.

## Controlled proof that feedback changes choice

The regression test uses the same public initial state and attention seed for fresh and learned
sessions. A compiled, context-matched, formally audited negative consequence is attached to the
fresh winner. The learned planner recalls it with activation `1`, changes that candidate from
score `0` to `-154`, and selects a different legal action before submission. The live session
checkpoint remains identical before and after both plans.

This proves the new data path is causal:

```text
candidate Q -> real/controlled compiled query vector -> personal GTE Top-K
-> audited actual consequence -> candidate score -> selected payload
```

## Real revision-7 comparison

Run:

```powershell
node projects/western_fantasy_continent/experiments/ufs_prechoice_planner_v23/run-initial-comparison.js
```

At the initial die boundary, both players attempted 45 visible combinations and accepted 40.
Fresh and learned both selected `r1-gray-0 -> A-r1-c2`. The learned player recalled feedback for
5 candidates, with observed activation up to about `0.82`, but those historical rows only verified
that a die became placed and supplied no track-valued decision consequence.

After replaying the same public five-placement prefix to the first room boundary, both players
attempted 10 operations and accepted 9. Both selected `resolve_room(A-upper-energy)`, whose imagined
energy gain scored `10`. The learned player recalled three energy-room feedback rows for that
candidate, with top activation `0.92179`, but none could adjust the score because the historical
audited value was stored as `undefined`.

That exposed a separate scalar-ticket bug. Historical controllers wrote, for example,
`itemId=track:energy` together with redundant `field=energy`. The old reader treated scalar energy
as an object and read `.energy`, erasing the actual numeric value. The reader now treats every
`track:*` target as scalar even when the legacy redundant field is present. New feedback therefore
stores usable numeric values. Existing revision-7 entries already persisted as `undefined` are not
guessed or silently rewritten.

## Conclusion

The fixed policy is no longer the active V22 autoplay path: future choice steps call the planner.
The planner and personal GTE can demonstrably change an action before submission. The real old
revision-7 profile does not yet change the first or first-room choice, because its relevant historic
evidence lacks usable decision values, not because retrieval is absent.

This is still one-boundary planning. Multi-step room completion, round-level planning and terminal
loss attribution remain deliberately out of scope.
