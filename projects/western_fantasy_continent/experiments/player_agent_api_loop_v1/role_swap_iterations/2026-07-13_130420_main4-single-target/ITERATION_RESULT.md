# Role Swap Iteration: Main 4 Single-Target Lock

- Status: partial playtest, design verdict `REVISE`
- Single teaching variable: turn player-agent Main 4 into a visible sustained-single-target check.
- Fresh player agent: `019f5c7f-cb2a-7db3-bb8a-8f858ac64a33`
- Close result: explicit close while running; previous status `running`, final status `shutdown`.
- Completed evidence: 12 full decision/attribution cycles plus a cycle 13 decision; the cycle 13 attribution was not applied to the session.

## Why This Variable

The previous Main 4 did not distinguish the unlocked Ranger from the Mage. In 100 matched simulations, both teams won every run; Mage averaged 13.73 seconds and Ranger averaged 19.18 seconds. The player therefore had no combat reason to learn a Ranger-specific function.

The candidate replaces only the player-agent variant of Main 4 with one 850-HP bear and exposes the hint `一头高生命蛮熊；需要对同一目标保持持续输出`. The default and frozen map candidates keep their old encounter.

## Mechanical Check

- Fresh roster, 20 matched seeds: Mage team won 1/20; Ranger team won 20/20.
- End-of-partial-run equipment state, 100 matched seeds: Mage team won 20/100 with 0.20 average survivors; Ranger team won 100/100 with 1.00 average survivors.
- The real agent run nevertheless hit a winning Mage seed and cleared with one survivor.

Conclusion: the role contrast is real, but it is probabilistic once the player has repeatedly equipped the frontline. Mechanical differentiation passed; the natural teaching route did not.

## Player Path

1. Cleared Main 1 and equipped both drops on the Warrior.
2. Cleared Main 2, unlocked the Mage, and naturally replaced the Spear Militia with it.
3. Equipped two more pieces on the Barricade Militia.
4. Cleared Main 3 and learned that the Mage led damage.
5. Spent three more actions equipping the frontline instead of entering the Prison branch.
6. Chose Main 4 because it was the next main node and visible equipped power had reached 195.
7. Treated the Prison rescue as attractive but secondary because its reward was unspecified.
8. Cleared Main 4 with the Mage team; only one ally survived.

The decisive raw comparison was: `Prison offers a rescue, but the current visible goal is main progression and the bear fight is directly available.` This is a rational choice from player-visible facts, not an Agent compliance failure.

## A-G Verdict

**A. Natural swap?**

Yes for the Mage at cycle 5, without evaluator prompting. No Ranger swap occurred because the Ranger was never rescued.

**B. Why no Ranger swap?**

This is a teaching-design failure, not a bad player judgment. Known equipment gains and the available main node had clearer expected value than an optional branch whose reward said only that someone could be rescued.

**C. Challenge and contribution evidence?**

The Mage was actively tested and produced visible proof: 321.31 damage and four skill casts in the Main 3 win, then 533.04 damage and 57.03% damage share in the Main 4 win. There is no Ranger contribution evidence because no Ranger unlock occurred.

**D. Knowledge update?**

The Agent learned that the Mage was a strong output upgrade and retained it. It also learned after Main 4 that the prepared team could clear the bear but that the win was fragile because only one ally survived. It learned nothing about the Ranger.

**E. Emotion acceptable?**

Yes. Severity `none`. Emotion moved from 38 to 43.9234, never fell below 38, and the largest automatic single-step decrease was -0.0014. There was no sustained decline, unrepaid effort, or failure spiral. This means emotion did not cause the teaching failure.

**F. Keep, revert, or advance?**

Keep the encounter as a mechanical candidate, but do not advance or freeze it as a successful teaching design. Verdict `REVISE`; design severity `serious`, emotion severity `none`.

**G. Next single variable?**

Change only the Prison's player-visible reward specificity after Main 3: identify that the rescue is a sustained-single-target Ranger instead of showing a generic `new character` reward. Do not hard-gate Main 4 behind the Prison and do not make the bear numerically harsher. The next run should test whether a legible optional key can compete with known equipment and main-route momentum.

## Boundary And Method Audit

- Decision requests checked: 13.
- Information boundary: PASS.
- Player-visible state contained no evaluator experiments, hidden swap objective, evaluator hypothesis, or discovery-goal instruction.
- Private evaluator recorded only the Mage experiment as resolved.
- Exactly one isolated player agent was used and explicitly closed.
- No server or frontend was started.

## Skill Judgment

No skill change this round. The cognition model correctly predicted preference for a known, repeatable power source over an unspecified optional reward. The defect is in reward legibility and route incentive, not in the current player-cognition rules.
