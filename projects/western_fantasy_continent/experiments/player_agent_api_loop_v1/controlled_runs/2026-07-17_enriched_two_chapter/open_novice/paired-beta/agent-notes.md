# Open-Novice Paired-Beta Agent Notes

- Profile: `open_novice`
- Seed: `paired-beta`
- Requested model: `5.5fast`
- Model selection status: `unsupported_by_current_orchestrator`
- Actual model: `unknown_platform_default`
- Persistent Agent session: `player-agent-4b256d6ea45b8432` in both chapters
- Result: complete, Chapter 1 and Chapter 2 cleared
- Cycles: Chapter 1 = 37, Chapter 2 = 20, total = 57
- Combat: 22 challenges, 20 wins, 2 losses

## Route and learning story

The novice opened with the linear Chapter 1 route, recruited the mage, and overreached into the prison at only 50 visible equipment power. After a first loss, the player filled several obvious empty equipment slots but tried the prison again too early and lost a second time. The player then returned to the main route, cleared the bandit camp, recognized that its fixed shield-breaking and armor-breaking rewards matched the prison's visible defenses, and won the third prison attempt with all four heroes alive. This resolved the roster-specific failure memory rather than avoiding the branch permanently.

The rescued ranger was equipped with the camp's matching bow and tested in the active roster. It recorded 46.84% of team damage in Main 6 and 47.06% in the high-health Main 7 encounter, confirming the novice's sustained-damage hypothesis. The final Chapter 1 roster was warrior, ranger, mage, and herb militia. It cleared Main 8, Main 9, Main 10, and the boss with four survivors each.

The same Agent session and carried cognition continued into Chapter 2. The player chose the priest rescue first because the only remaining militia role was support, then completed the flag trial, returned for the knight rescue, completed the shield trial, confluence, and final boss. The rescued priest replaced the herb militia only after a deliberate same-role test. The swap initially reduced active power from 1113 to 842 because the priest was unequipped, so the novice filled its carried empty slots before combat. In the flag trial the priest produced 343.04 healing and 333.59 shielding, confirming the precommitted `heal >= 100` hypothesis. The final roster was warrior, ranger, mage, and priest, and every Chapter 2 combat ended with all four alive.

## Probability caveat

This was requested as a non-jackpot paired-beta comparison, but the simulator generated one mythic drop at Chapter 2 cycle 16: `r2_shield_trial_1_0`, mythic level-26 leg armor with 12 affixes. Equipping it on the active warrior increased power from 1247 to 1407. The run was not rerolled or altered because probability outcomes are code-owned. Therefore this completed trajectory is a jackpot run and must not be treated as a valid non-jackpot comparison without an explicit analysis caveat or a replacement run under a genuinely non-jackpot seed.

## Artifacts and integrity

Exact decision and attribution requests/responses are archived under `artifacts/`. `session.json` contains the authoritative persistent state and raw histories; `summary.json` contains the generated route summary. No core simulator or cognition source was edited during this run.

Validation: `validate-enriched-two-chapter-run.js <session.json>` returned `PASS`. The generated summary reports both chapters complete, 57 total cycles, 20/22 combat wins, one mythic drop, and the same Agent session ID across both chapters.

Independent review was not run for this trajectory.
