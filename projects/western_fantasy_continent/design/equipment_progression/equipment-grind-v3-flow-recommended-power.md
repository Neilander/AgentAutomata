# Equipment Grind V3 Flow Recommended Power

Definition: first-clear p70 is a progression diagnostic, not the displayed recommendation. It can underestimate late-game displayed power if the grind-flow simulator's power formula drifts from the V3 UI formula.

Settings: 40 seeds, 100 max runs, target 70%, local band +/-10%, minimum 10 attempts.

| Dungeon | Old | New recommended | Basis | Diagnostic bucket win | First-clear p70 power | First-clear median run | Total challenge attempts |
|---|---:|---:|---:|---:|---:|---:|---:|
| D1 | 4000 | 3000 | first-clear p70 power | 60%/10 | 2941 | 1 | 512 |
| D2 | 9600 | 5500 | first-clear p70 power | 71%/14 | 5338.98 | 10 | 137 |
| D3 | 16000 | 7500 | first-clear p70 power | 42%/12 | 7320.51 | 15 | 122 |
| D4 | 21900 | 11000 | first-clear p70 power | 30%/30 | 11203.7 | 24 | 179 |
| D5 | 38900 | 17000 | first-clear p70 power | 31%/48 | 17453.1 | 39 | 240 |
| D6 | 52500 | 24000 | first-clear p70 power | 46%/33 | 23997.95 | 46 | 148 |
| D7 | 64500 | 28000 | first-clear p70 power | 39%/31 | 28381.37 | 46 | 150 |
| D8 | 85800 | 32000 | first-clear p70 power | 21%/14 | 32284.5 | 34 | 132 |
| D9 | 107700 | 35000 | first-clear p70 power | 60%/10 | 34769.33 | 36 | 26 |
| D10 | 107700 | 48000 | first-clear p70 power | 14%/72 | 48024.81 | 53 | 130 |

## Notes

- This replaces the previous static similar-power-team interpretation for the displayed recommendation.
- It only samples rows where the grind loop is actively challenging the next uncleared dungeon, so farm/overkill rows do not inflate the recommendation.
- The local bucket win rate is kept only as a diagnostic; the displayed recommendation uses first-clear p70 because the user wants a practical progression recommendation, not a stable-farm threshold.
- If a late dungeon has thin samples, rerun with higher `SEEDS` before treating the number as final.
