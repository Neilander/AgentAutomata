# V21 paired learning-effect protocol

## Question

Does the personal feedback captured from V20 episode 1 change episode-2 predictions or decisions
relative to a completely fresh player under comparable attention and formal randomness?

## Frozen baseline

- Both arms use frozen template `ufs-page9-rule-reader-player-v1` after line-ending-independent
  fingerprint normalization.
- Both arms use attention seed `2026082920`.
- Both arms start from the same formal public initial state.
- The same controller model, settings, public information boundary, and decision-rationale format
  must be used for both arms.
- External random observations come from `random-tape.json`. Pairing is by boundary type and
  occurrence number, not by total command number. Divergent white-reroll demand therefore does not
  shift the next-round-roll stream.

## Isolation

- Treatment profile: `profiles/treatment-v20-revision1.json`.
- Control profile: `profiles/control-fresh-revision0.json`.
- Treatment state: `states/treatment-episode2/`.
- Control state: `states/control-episode1/`.
- Each arm gets its own `payloads/`, `evidence/`, `DECISIONS.md`, and capture target.
- Never copy cognition from treatment to control. Never reuse a state directory. Never capture one
  arm into the other arm's profile.

## Paired randomness

At a public random boundary, materialize an observation with:

```text
node materialize-random-observation.js <treatment|control> <occurrence>
```

The script derives die values from the committed tape seed, boundary type, occurrence, and die
ordinal. Pass the resulting arm-local JSON file to:

```text
node ../ufs_first_action_imagination_v0/full-game-attention-player-cli.js random <state-dir> <observation.json>
```

The CLI rejects the file unless its operation type, die IDs, and values exactly match the current
public boundary.

## Five preregistered comparisons

For every arm, record the first relevant opportunity and any recurrence:

1. `zero_energy_trap`: whether the player predicts resource lockout and preserves a viable energy
   route before spending the last energy.
2. `incomplete_energy_room`: whether it distinguishes a partially filled energy room from a
   resolvable one and avoids claiming immediate income.
3. `research_rollback`: whether it predicts the visible mothership-row research penalty and plans
   around the post-rollback value.
4. `mothership_danger`: whether it predicts the skull-row deadline and gives it material weight in
   placement, room, and spawn choices.
5. `invalid_choice`: count rejected operations and classify contract/payload errors separately from
   strategically legal but ineffective choices.

For each opportunity record: public evidence, pre-action prediction, seriously considered
candidates, submitted choice, formal accepted/rejected result, and feedback disposition. If an arm
never encounters a category, mark it `not_observed`; do not infer improvement.

## Stage gate

Run the arms in alternating paired blocks and stop each at the first Round 4 next-round-roll
boundary after three completed rounds. Verify each arm independently before any Round 4 roll. Do
not continue to terminal outcome unless both stage gates pass and the comparison log is complete.

Do not capture either arm during the setup or three-round gate. Capture remains a separate root
audit action after pending prediction tickets are checked.

