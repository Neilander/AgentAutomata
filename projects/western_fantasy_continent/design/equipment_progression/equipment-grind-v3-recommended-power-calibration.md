# Equipment Grind V3 Recommended Power Calibration

Goal: recommended power should be validated by teams with similar displayed power, not by enemy budget alone.

Settings: target win rate 70%, power band +/-8%, team pool 720, teams per bucket 6, seeds per team 1.

| Dungeon | Old | New | Similar-team avg | Win rate | Games | Avg duration | Enemy power proxy |
|---|---:|---:|---:|---:|---:|---:|---:|
| D1 | 3000 | 4000 | 3964.46 | 78% | 18 | 20.2s | 2690.33 |
| D2 | 5500 | 9600 | 9551.97 | 78% | 18 | 19s | 5932.88 |
| D3 | 8000 | 16000 | 16032.5 | 89% | 18 | 21.6s | 9624.31 |
| D4 | 12000 | 21900 | 21926.62 | 72% | 18 | 32.4s | 14063.35 |
| D5 | 18000 | 38900 | 38920.38 | 83% | 18 | 25.4s | 20461.23 |
| D6 | 24000 | 52500 | 52466.66 | 72% | 18 | 26.2s | 28484.77 |
| D7 | 30000 | 64500 | 64497.91 | 72% | 18 | 29.2s | 37928.55 |
| D8 | 38000 | 85800 | 85843.03 | 83% | 18 | 26s | 49981.85 |
| D9 | 40000 | 107700 | 107703.57 | 89% | 18 | 18.3s | 62495.07 |
| D10 | 49000 | 107700 | 107703.57 | 28% | 18 | 17.4s | 111581.73 |

## Notes

- The script builds a broad pool of random four-character teams with real equipment modifiers, then buckets them by displayed team power.
- Each dungeon is tested against teams inside a +/- power band and all enemy sets.
- The selected recommendation is the first tested bucket whose similar-power teams reach the target win rate.
- D10 still does not reach the 70% target in the sampled pool. Its displayed value should be treated as a warning/terminal-wall marker rather than a validated recommendation.
