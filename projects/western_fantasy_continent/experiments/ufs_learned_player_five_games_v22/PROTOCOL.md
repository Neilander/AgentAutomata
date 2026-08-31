# V22 five-consecutive-game protocol

## Frozen starting point

- Input profile: `../ufs_revision1_vs_fresh_control_v21/profiles/treatment-v20-revision1.json`.
- Required input SHA-256: `a1c3a2f13257cd89eea08581137ad1fedbd0b81addda0eff5a0ee4a4e9b8d92c`.
- Player: `ufs-v20-fresh-player`, input revision 1, one previously captured episode.
- Attention seed: the profile's frozen `2026082920` for every episode.
- Random tape: local `random-tape.json`, seed `2026082922`, keyed by pending type, occurrence,
  and sorted public die ordinal.
- The source profile is read-only.  Game 1 captures to a new revision-2 file; later games each
  consume the immediately preceding output and capture to a new file.

No V21 state/checkpoint, V21 three-round capture, old fb2/fifteen-day-web artifact, or prior game
payload is an episode input.  Every game begins from the formal initial state through
`player-start` in a fresh state directory.

## Player information boundary

The controller may use only the latest compact public response/current-player-view,
`operationContracts`, public candidate IDs, this protocol, and stable UFS rule knowledge.  It may
not inspect the formal host checkpoint, attention audit, feedback audit, profile internals, or
post-hoc metrics while selecting an action.  Those private artifacts are read only after an
episode has reached a formal terminal result.

Every deliberate `advance` operation must be preceded by a concise decision entry and carry at
least one explicit prediction ticket.  Random values are never invented by the controller: the
precommitted observation materializer derives and records them.  Rejected submissions remain in
the same episode and must be recovered legally; they never authorize restart or seed selection.

## Frozen decision policy

The same controller implementation and ordering rules are used for Games 1-5.  It reads only the
public operation contract and applies these priorities:

1. Complete affordable energy rooms and preserve an energy route; never call an incomplete room
   resolvable or predict income from a partial room.
2. Resolve affordable research/energy/fighter rooms before lower-value optional rooms; choose the
   largest publicly permitted research advance.
3. Prefer legal placements that complete energy, then research, then fighter/excavation rooms;
   avoid already-used columns and prefer higher dice where the public room semantics make that
   useful.
4. Excavate the deepest current affordable public placement; otherwise skip that worker.
5. End rooms only after no productive public operation remains, predict the visible mothership
   deadline consequence, and choose a public spawn point deterministically.

If the public view exposes an activated learned trajectory, it may be cited in the decision and
prediction.  The controller does not read the profile to manufacture such activation.

## Isolation and capture contract

Each game has its own `states/game-NN`, `records/game-NN`, `payloads`, `evidence`, decision log,
input profile reference, output profile, terminal snapshot, capture stdout/stderr, and receipt.
Capture occurs once, only after terminal evidence validation and zero pending prediction tickets.
The output revision and next episode ordinal must increment by one.  No formal board field may be
stored in a player profile.

## Preregistered measures

For every game record:

- formal win/loss and reason;
- terminal round, city damage, energy, research index, excavator index, mothership row;
- total public records and operations, deliberate/random/rejected/invalid counts;
- deliberate prediction coverage and confirmed/contradicted/unresolved/ambiguous ledger deltas;
- newly learned trajectories, reinforced connections, attention adjustments, quarantines;
- actual `feedback-*` activation count in prediction/decision traces (unique IDs and occurrences);
- zero-energy trap exposures, incomplete-energy-room exposures, research rollbacks,
  mothership-danger exposures, and invalid choices.

Primary Game-1-vs-Game-5 ordering is: win over loss; if equal, later survival/earlier win; then
lower damage and mothership danger; then higher research, excavation, and energy.  Process evidence
(fewer invalid/rejected choices, fewer zero-energy traps, better prediction resolution) is
reported separately and cannot override a worse formal result.  Learning is called improved only
when the preregistered measures favor Game 5 and the evidence distinguishes persistence,
activation, and outcome.  Different boundary sequences or terminal luck are reported as exposure
differences, not treated as learning causality.

## No rerun rule

There is one canonical attempt per game.  A real generic system blocker may be fixed minimally
with regression coverage, but the affected whole game must then restart in a new explicitly
quarantined attempt.  Ordinary randomness, choice, rejection, or loss is never a blocker and is
never rerun for a better score.

