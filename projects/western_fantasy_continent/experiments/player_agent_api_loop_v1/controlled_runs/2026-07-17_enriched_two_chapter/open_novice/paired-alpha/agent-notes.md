# Open novice agent notes — paired-alpha

## Run identity

- Profile: `open_novice`
- Seed: `paired-alpha`
- Completion: both chapters cleared
- Cycles: chapter 1 = 33; chapter 2 = 16
- Persistent agent session: `player-agent-a7246b66636ea2e4` in both chapters
- Requested model: `5.5fast`
- Actual model: `unknown_platform_default`; the current orchestrator reports the requested model as unsupported, so this run must not be described as an actual 5.5fast run.

## Player-side account

I began with weak priors and treated newly visible roster options and optional first-clear nodes as useful experiments. I repeatedly kept three members that had good evidence and changed one uncertain slot. Clear contribution evidence changed my choices quickly: the mage, ranger, and berserker earned continued use; the assassin and warlock were dropped after missing their explicit damage thresholds.

The most decisive correction came at chapter-1 main stage 6. I first tried the newly unlocked bard and lost with all four allies dead and three enemies still alive. The stage exposed heavy shields, large enemy shielding, and dangerous ranged pressure. I then equipped the armory camp's shield-breaking bow and axe, added armor-breaking gloves, and restored the berserker. Displayed power rose from 263 to 630, the retry won in 18.88 seconds, and the field explicitly showed both armory effects activating. This was the clearest case where a failure redirected behavior rather than merely lowering confidence.

In chapter 2 I continued to explore new heroes, but used cleared encounters when possible before the boss. The knight produced real shielding and the priest produced both healing and shielding. The alchemist cast enough skills to confirm activity, but supplied no healing or shielding; because the faster comparison was confounded by a new mage charm, I restored the priest for the boss. The final boss win kept all four allies alive.

## Hypothesis outcomes

Confirmed:

- Drummer used team-support skills in the next combat.
- Mage ranked in the top two for damage.
- Berserker ranked in the top two for damage.
- Ranger ranked in the top two for damage.
- Bard cast at least two skills, although that lineup still lost its first main-stage-6 attempt.
- Knight produced positive shielding.
- Priest produced positive healing.
- Alchemist cast at least three skills.

Refuted:

- Assassin did not rank in the top two for damage; it ranked fourth.
- Warlock did not reach 20% team damage; it reached 15.79%.

## Salient behavior

- Chose both chapter-1 optional first-clear branches before finishing the main route and used their rewards to solve the first hard failure.
- Tried every newly unlocked complete hero at least once when a reasonable comparison slot existed.
- Preferred supplied fit evidence over a rough item-level guess when the two disagreed.
- Accepted temporary displayed-power losses for bounded roster experiments, then restored proven/equipped heroes when evidence was weak or refuted.
- Retained the ranger after repeated top-two damage results and gave it the strongest clearly matched legendary chapter-1 boss drop.
- Chose recovery for the chapter-2 boss after observing the same flag-retaliation rule in a long trial.

## Final state

- Final team: warrior, mage, priest, ranger
- Final displayed equipped power: 1250
- Combat record: 21 wins, 1 loss, 22 challenges
- Manual equips: 14
- Roster swaps: 13
- Final emotion: 97.3944

## Remaining uncertainty

- Several successful retries changed both roster and equipment, so their causal effects are not fully isolated. The main-stage-6 reversal strongly supports the combined preparation, not a precise share for each item or the berserker swap.
- Skill-count hypotheses confirm that a support hero acted, not that the hero was the best team choice. This mattered for the bard and alchemist.
- The confluence comparison between priest and alchemist was confounded by equipping the mage's 151-power epic charm before the alchemist repeat.
- No roster-prediction-A settlements were recorded by the summary, so this run should not be used as evidence for that subsystem.

## Scope note

Only `paired-alpha` was run. `paired-beta` was intentionally not started.
