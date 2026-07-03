# Agent Handoff: Equipment Grind V2 Feedback Curve Simulation

- Date: 2026-07-02
- Agent/thread: Codex local simulation pass
- Scope: Add and run an automated `刷装备V2` grind-loop simulation with positive-feedback and boredom tracking.
- Status: complete

## User Intent

The user proposed measuring the grind loop as felt progression, not just team power. They wanted an automated run that starts with six random characters, chooses a team, fights dungeons, auto-equips loot, advances to the next dungeon, and tracks:

- combat time only, excluding equipment management time;
- time-tier improvements using `60s / 45s / 30s / 15s / 0` style cognition bands;
- `+1` positive feedback when combat time improves by one cognition tier;
- `+6` positive feedback on first clear of a dungeon;
- `+8` positive feedback when a new item/drop layer is unlocked;
- small positive feedback from power growth;
- `+5` boredom after three runs without positive feedback.

## Completed

- Added `projects/western_fantasy_continent/game_data/simulate-equipment-grind-v2-feedback.js`.
- The script reads live V2 `DUNGEONS` from `equipment_grind_v2/equipment-grind-simulator.js`.
- It creates a random six-character roster, auto-equips loot by role-weighted item score, selects the top four active heroes, and runs real `combat-sim` 4v4 fights.
- It models loop behavior:
  - challenge next uncleared dungeon;
  - on win, gain loot, auto-equip, unlock next dungeon;
  - on failure after at least one clear, return to the highest cleared dungeon to grind;
  - track combat duration, power changes, first clears, new drop-layer unlocks, positive feedback, and boredom.

## Simulation Results

### Seed `feedback-loop-v2`

- Final clear: D3
- Final power: `10970`
- Positive feedback: `60.1`
- Boredom: `10`
- Shape:
  - D1 clear on run 2.
  - D2 clear on run 9.
  - D3 clear on run 20.
  - After D3, the run hit a bad stretch: D4 failed, then D3 farming was unreliable, causing two boredom events.

### Seed `feedback-loop-v2-b`

- Final clear: D2
- Final power: `8875`
- Positive feedback: `40.74`
- Boredom: `15`
- Shape:
  - Very poor early D1 reliability: first clear only on run 5.
  - D2 clear on run 22.
  - Could not break D3 by run 36.
  - This seed shows current initial roster/enemy-set variance can make the early game feel stale.

### Seed `feedback-loop-v2-c`

- Final clear: D6
- Final power: `28423`
- Positive feedback: `127.19`
- Boredom: `0`
- Shape:
  - D1 clear on run 1.
  - D2 clear on run 6.
  - D3 clear on run 9.
  - D4 clear on run 19.
  - D5 clear on run 24.
  - D6 clear on run 27.
  - This seed has a strong wave cadence: challenge, fail, farm, power jump, first clear, next wall.

## Current State

The feedback model works and produces readable curves. It reveals that the current V2 loop can feel good when the initial roster is healthy, but can become stale when the random six-character pool lacks stable early clear power. The biggest design issue exposed by this simulation is not just enemy strength; it is variance in early roster quality and farming reliability.

## Files Changed

- `projects/western_fantasy_continent/game_data/simulate-equipment-grind-v2-feedback.js`: new feedback-curve simulation.
- `coop_repo/LATEST.md`: updated latest handoff.
- `coop_repo/REPORT_INDEX.md`: added this report.

## Validation

- `node -c projects/western_fantasy_continent/game_data/simulate-equipment-grind-v2-feedback.js`: passed.
- Ran:
  - `node projects/western_fantasy_continent/game_data/simulate-equipment-grind-v2-feedback.js`
  - `SEED=feedback-loop-v2-b RUNS=36 node projects/western_fantasy_continent/game_data/simulate-equipment-grind-v2-feedback.js`
  - `SEED=feedback-loop-v2-c RUNS=36 node projects/western_fantasy_continent/game_data/simulate-equipment-grind-v2-feedback.js`

## Unresolved

- The auto-player currently returns to the highest cleared dungeon after failing the next challenge. If that highest cleared dungeon was a lucky clear, farming it can repeatedly fail and create boredom. A smarter player model should fall back to the highest reliably farmable dungeon.
- Time-tier feedback is currently sparse because many fights are already under 30s or fail by wipeout rather than timing out. If we want time reduction to carry more of the feedback curve, enemy durability and damage pacing need separate attention.
- Power feedback is capped at `+3` per run to prevent power jumps from dwarfing first-clear and unlock feedback. This cap is a design assumption, not yet validated.

## Recommended Next Step

Add a "reliable farm target" rule to the simulation: after two failed farm attempts at the highest cleared dungeon, farm one tier lower until the team receives another meaningful power upgrade. Then rerun the three seeds and compare boredom curves before changing live dungeon numbers again.
