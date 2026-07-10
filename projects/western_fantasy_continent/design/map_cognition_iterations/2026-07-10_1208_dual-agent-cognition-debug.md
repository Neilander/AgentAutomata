# Dual-Agent Cognition Debug

- Date: 2026-07-10
- Scope: first-region real combat, player cognition, repeat farming, role proof
- Status: second-pass working candidate

## Test Shape

Two knowledge-bounded player agents ran the first region twice:

- A / A2: goal-driven ordinary player;
- B / B2: cautious loot-oriented player.

The agents could only read a structured player observation and choose an exposed action. Separate session files preserve every real battle, drop, equipment change, failure, and retry.

Supporting tools:

- `map-progression-cognition-core.js`: real combat and visible-observation model;
- `map-cognition-session.js`: stateful player-agent session runner;
- `analyze-map-cognition-batch.js`: multi-seed progression and bypass analysis;
- `sweep-map-node-balance.js`: node strength and role-proof sweeps.

## Baseline Findings

Before tuning:

- player A: 12 wins, 0 losses, 12 steps;
- player B: 12 wins, 0 losses, 12 steps;
- 40-seed batch: 100% completion, 0 failures, 0 real decision points;
- Prison: 40/40 first-attempt wins;
- Camp: never entered;
- Main 5 with Mage versus Ranger: effectively identical survival outcome;
- every fight ended with all four player units alive.

The baseline therefore did not validate cognition. It validated a forced linear script.

Root causes:

1. Prison enemies had their passive and ultimate disabled.
2. Prison strength was far below the player team.
3. Cleared nodes could not be farmed again.
4. Camp stayed preview-only forever when Prison was cleared without failure.
5. A second Prison failure focused Prison again even though no wake condition occurred.
6. The rescued Ranger automatically replaced the Mage, but Main 5 did not expose a useful Ranger-specific signal.
7. The page contained false signals: `auto victory`, multi-wave enemy descriptions, promised gold with no gold system, and duplicate reward logs.

## Changes

- Prison and boss enemies now use full role kits.
- Prison real-combat strength uses a `2.05` encounter multiplier; formal role/base values were not changed.
- Cleared main and branch nodes are repeat-farmable.
- After Prison failure, Camp opens; after another failure, focus returns to Camp until a visible equipment change wakes retry.
- If a player clears Prison on the first try, Camp no longer remains permanently preview-locked.
- The page now shows total equipment strength and four slot strengths.
- Main 5 repeats the heavy-shield problem from Camp so the rescued Ranger has a readable follow-up test.
- False or stale UI signals were removed or corrected.
- The cognition reference now requires observation, action, system, and memory parity.

## Post-Tuning Evidence

### Batch

160 deterministic seeds:

- completion rate: `100%`;
- average steps: `14.738`;
- average losses: `1.275`;
- first Prison failure: `130/160` (`81.25%`);
- first-attempt bypass: `30/160` (`18.75%`);
- Camp win rate: `100%`;
- Main 5 through boss completion: `100%` after the resolved Prison loop.

The automated bounded policy follows:

```text
Prison loss -> Camp -> visible equipment change -> Prison retry
Prison loss again -> repeat Camp -> new equipment change -> retry
```

### Second Player-Agent Round

A2 received a bypass seed:

- Prison first-try win with two survivors;
- no farming because no failure created a reason;
- 12-step completion;
- correctly demonstrated that bypass players do not learn Camp as a key.

B2 received a lock seed:

- Prison first attempt: complete loss;
- Camp increased equipment strength `19 -> 57`;
- Prison retry: win with two survivors;
- later performed only two goal-directed Camp farms;
- stopped farming immediately after a no-improvement result;
- 16-step completion, final equipment strength `110`.

### Ranger Proof

At equipment strength 60 against Main 5's repeated heavy-shield problem:

| Team third slot | Win rate | Average duration | Average HP margin |
| --- | ---: | ---: | ---: |
| Mage | 100% | 14.449 s | 3.592 |
| Ranger | 100% | 11.436 s | 3.833 |

The Ranger version resolves the same fight about `20.9%` faster with a slightly healthier finish. This is a useful process signal, but the live page still needs a concise contribution readout if the player is expected to attribute the gain specifically to the Ranger.

## Cognition-Simulator Problems

1. The simulator can be more informative than the actual page. If it exposes exact slot strengths, current goals, or HP scores that the page hides, the result is optimistically biased.
2. `cognition.behaviors` can claim the player knows how to change team while no real team-change control exists. Knowledge without an executable action is invalid.
3. Automatic equipment and automatic Ranger replacement mean this pass validates `farm -> automatic improvement`, not manual equipment choice or team composition.
4. Both player agents have perfect memory and follow explicit rationality constraints. They do not represent distracted, impulsive, forgetful, or low-comprehension players.
5. One playthrough cannot validate a probabilistic teaching lock. A2 and B2 reached opposite learning outcomes from different seeds.
6. An explicit generated `currentGoal` can over-guide the agent unless the real UI communicates the same goal through focus, hierarchy, or text.

## Remaining Map Problems

1. About `18.75%` of seeds bypass the first Prison failure and therefore miss the intended Camp-as-key lesson. This may be acceptable as an alternate lucky route, but it must be a conscious product choice.
2. Main 5 gives a measurable Ranger advantage, but the player does not yet receive a direct role-contribution summary.
3. Equipment is still automatically selected. The system cannot yet test `inspect drop -> choose item -> equip -> verify` cognition.
4. The rescued character automatically replaces the Mage. The system cannot yet test whether the player understands or chooses a role swap.
5. Main 6-10 and the boss remain guaranteed clears after the Prison loop. The first region currently has one meaningful wall, not a complete wave-shaped sequence.
6. Regions 2 and 3 were not calibrated in this pass.
7. Map challenge resolves through real headless combat, but visible battle replay is still a separate presentation path.

## Next Design Decision

Decide whether the first Prison lock should be:

- probabilistic, preserving the current `18.75%` lucky bypass; or
- nearly guaranteed, raising Prison multiplier slightly so nearly every new player learns the Camp key.

After that decision, the highest-value implementation is a small real choice layer for equipment and team replacement. Without it, later cognition simulation should not claim to validate manual build diagnosis.
