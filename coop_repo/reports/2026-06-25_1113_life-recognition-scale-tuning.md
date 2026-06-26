# Agent Handoff: Life Recognition Scale Tuning

- Date: 2026-06-25
- Agent/thread: Codex desktop
- Scope: Life recognition simulator numeric scale
- Status: complete

## User Intent

The user pointed out that the life simulator's recognition values were unusable because ordinary daily events all collapsed to values around 1-2. They clarified that true maintenance actions such as eating or showering can indeed have almost no recognition, but the model still needs ordinary life events across several-unit, teens, twenties, thirties, and forties recognition bands.

## Completed

- Changed recognition from pure inverse-probability to authored base recognition with probability modulation:
  - Old: `eventRecognition = (1 / successRate) ^ x`
  - New: `eventRecognition = baseRecognition * (1 / successRate) ^ (x - 1)`
- Added low-recognition maintenance cards:
  - `吃饭洗澡`: base recognition 1, success 100%.
  - `按时睡觉`: base recognition 4, success 93%.
- Retuned ordinary life / growth cards:
  - `整理房间`: 8.
  - `认真做一顿饭`: 14.
  - `完成日常训练`: 20.
  - `约朋友吃饭`: 24.
  - `连续一周训练`: 31.
  - `公开作品`: 36.
  - `申请理想职位`: 46.
- Adjusted all cards below 40 base recognition to have success rates of at least 90%, so low/mid daily recognition is no longer driven by low probability.
- Updated UI label from `认可指数 x` to `稀有调制 x`.
- Retuned pleasure as a fast-changing state:
  - Default decay is now 6 instead of 3.
  - Success gives much larger pleasure movement.
  - Self-recognition growth is slower than pleasure growth.
  - Added `解决棘手小问题` at 55% / 42 recognition and `完成困难任务` at 44% / 54 recognition to test medium-probability mood spikes.
- Retuned success-side self-recognition as evidence-based reappraisal:
  - If event recognition is far above current self-recognition, self-recognition now jumps toward the event value immediately.
  - If event recognition is below the current baseline, it only gives small confirmation.
  - Example: starting self-recognition 0, completing a 36-recognition event now raises it to about 24; completing a 54-recognition event raises it to about 37.
- Retuned below-baseline success pleasure:
  - If event recognition is below current self-recognition, success no longer gives net pleasure growth.
  - It can only reduce the normal per-turn mood decay.
  - Example: at self-recognition 45 and pleasure 50, completing a 20-recognition event gives about -4 pleasure, 36 gives about -2, 42 gives about -1, while 54 gives about +22.
- Retuned above-baseline success pleasure through a soft cap:
  - Positive mood now uses `moodCap * (1 - exp(-rawMood / moodCap))`.
  - This replaces the previous direct sum of satisfaction, achievement, and challenge bonus that caused +80 jumps.
- Updated the simulator design note to document the new scale.

## Files Changed

- `projects/western_fantasy_continent/life_simulator/life-simulator.js`: formula and card scale.
- `projects/western_fantasy_continent/life_simulator/index.html`: slider label.
- `projects/western_fantasy_continent/design/life-recognition-simulator.md`: current formula and default scale.

## Validation

- `node --check projects/western_fantasy_continent/life_simulator/life-simulator.js`: pass.
- Manual value table generated with Node: default `x = 1` now produces recognition values from 1 to 96; cards below 40 recognition have 90%-100% success rates.
- Manual pleasure sample generated with Node after soft cap and decay 6: default state gains about +15 from a 55% / 42-recognition success and about +21 from a 44% / 54-recognition success; low-recognition low-pleasure state gains about +24 and +31 respectively.
- Manual self-recognition sample generated with Node: starting from 0, 36-recognition success reaches about 24, 42-recognition success reaches about 29, and 54-recognition success reaches about 37.
- Manual below-baseline sample generated with Node: at self-recognition 45, below-baseline events now have non-positive pleasure deltas.
- `git diff --check`: pass.

## Current State

The recognition slider no longer defines the whole event value. At default `x = 1`, cards use their authored base recognition. Raising or lowering `x` changes how much rarity bends those authored values.

This preserves the user's correction: pure maintenance can be almost valueless, while richer ordinary life events can still produce meaningful satisfaction or self-confirmation.

## Unresolved

- Failure damage is still mostly the old model and does not yet fully separate challenge failure from "I should have been able to do this" failure.
- Downward self-recognition movement has not yet been tuned to be slower/more gradual than upward evidence jumps.
- Pleasure spikes are now smoother, but still need playtesting against multi-turn mood decay and subjective feel.
- The simulator still has one global self-recognition baseline, not per-domain baselines.

## Recommended Next Step

Tune failure interpretation next. Add separate terms for challenge failure, expected-competence failure, and domain-specific baseline damage.
