# Independent Agent Review

## Scope

Five controlled battle-report slices were analyzed in forward and armor-first order. One accepted real recorded report was also analyzed. Agents were prohibited from reading `deterministic-result.json` or source code.

The five preset battles are controlled fixtures using the live semantic-event shape, not freshly simulated combat. The real-report source is:

```text
experiments/player_agent_api_loop_v1/causal_verification_v9_concept_interpreter/session.json
```

## Agent Results

### Godel: ordinary, forward order

Result: arithmetic and primacy logic accepted.

- Correctly calculated Warrior at `+185.15%`, ordinary level 7, in the weak swarm.
- Correctly calculated Warrior at `-58.82%`, level -2, against high armor.
- Preserved the first strong impression and added contextual corrections for mixed low armor, high armor, and low-armor elite.
- Correctly identified that three weak militia depressed the first team average and made the Warrior's first impression optimistically biased.

### Tesla: expert, forward order, original prompt

Result: total strength accepted; trait arithmetic rejected.

- Total unit strength calculations were correct.
- Domain magnitude incorrectly used `domain / expected - 1` because the original packet did not state the separate domain formula explicitly.
- This suppressed legitimate Mage, Ranger, and Priest traits.

Action taken: added the explicit rule `domain / expected * 100%; do not subtract 100%` to the packet.

### Rawls: expert, armor-first order

Result: order-bias conclusion accepted; trait gate partially rejected.

- Correctly created Warrior's general first impression as `明显偏弱` after armor appeared first.
- Correctly added a later positive `swarm + low_armor` correction without overwriting the first row.
- Correctly concluded that only the default no-context belief changes with order; exact context retrieval can still select the proper correction.
- Incorrectly described 100% single-target purity as a trait when its magnitude was below level 3.

### Sartre: accepted real report

Result: total strength arithmetic accepted; trait result exposed a report-boundary bug.

- Correctly calculated four active units and a mean useful contribution of `130.06775`.
- Correctly calculated Mage `+130.58%`, Herb Militia `-38.89%`, Barricade Militia `-70.72%`, and Warrior within the neutral band.
- The input packet lacked target-count reliability, so it generated a false Warrior single-target trait from ambiguous old events.

Action taken: added domain evidence reliability. Ambiguous same-concept hits are now low-confidence and cannot create traits. The real-report regression now produces only Mage's medium-confidence area-damage trait.

### Carver: expert, forward order, corrected formula

Result: arithmetic accepted; negative trait inference rejected.

- Explicit domain formula removed the earlier arithmetic ambiguity.
- Correctly calculated Warrior area level 9 in the swarm, ordinary strength in mixed low armor, weakness against high armor, and slight strength against the low-armor elite.
- Correctly calculated Mage area, Ranger single-target, and Priest healing trait magnitudes.
- Incorrectly treated a later battle without a strong domain result as evidence that the prior trait was false.

Action taken: V1 learns positive trait evidence only. Missing a threshold is not negative evidence unless opportunity and attempted behavior are explicitly known.

## Accepted Conclusions

1. Total unit strength is easy for an Agent to calculate when the report is compact and the formula is explicit.
2. Trait calculation needs a separately stated domain formula; natural-language implication is not reliable enough.
3. The fixed preset sequences exhibit a reproducible order effect: weak-swarm-first and armor-first produce different weighted current beliefs. This does not yet establish a calibrated human effect size.
4. Append-only contextual correction preserves auditable observations and supports revisable belief. A future comparison against an overwrite baseline is still required before claiming it is empirically better.
5. Numeric calculation, threshold gating, evidence reliability, and retrieval priority belong in code. Agent output needs schema validation before becoming knowledge.

## Remaining Risks

- Negative perception bands are provisional.
- All useful-contribution channels currently use one HP-equivalent weight; control and prevention weights need later calibration.
- Team-average strength intentionally allows teammate confounding. It models player impression, not objective balance.
- Old live reports do not preserve `visibleTargetCount`; same-concept area attacks remain under-observed until the signal interpreter adds that aggregate.

## Independent Cognition Review

An independent reviewer returned `revise`, not `pass`. It accepted biased first impressions, append-only evidence, and context-first retrieval, but rejected permanent no-context first-impression lock. In the forward expert sequence, one extreme positive observation was followed by ordinary, two weak, and one mildly positive result, yet the old retrieval still returned the initial extreme claim.

The model now separates immutable observations from a revisable current belief. Earlier observations keep higher finite weight; they no longer overrule unlimited later evidence. Agent-authored causal explanations remain hypotheses until later evidence validates them.

## Final Blind Five-Battle Analysis

Anscombe analyzed the compact `forward_expert` packet while prohibited from reading source code, tests, `deterministic-result.json`, or this review. Its raw JSON is preserved at `generated/agent-forward-expert-analysis.json`.

The executable validator compared all five battles across contribution totals, team means, 20 unit strength calculations, semantic levels, eligible trait domains, Warrior observation order, and final weighted belief. Result: `PASS`, 118 checks, zero failures.

The Agent produced the intended biased-and-correctable knowledge sequence for Warrior:

1. weak swarm: `质变级强`, plus strong area-damage evidence;
2. mixed low armor: `表现普通`, plus threshold single-target evidence;
3. high-armor elite: `明显偏弱` contextual correction;
4. repeated high-armor elite: support the same correction;
5. low-armor elite: `有点强`, plus stronger single-target evidence.

Its final no-context level was `1.926773`, matching the executable synthesis (`偏强` after rounding). It preserved the level-9 first impression as history without treating it as permanent current belief. It also correctly refused to infer that armor caused the result; environment and performance were observed together, so causality remains a hypothesis.

## Final Independent Review

Two independent reviewers initially returned `REVISE` and exposed real defects: permanent first-impression lock, subset context matching, empty-context pollution, duplicate-report evidence inflation, rounded reliability threshold leakage, lost neutral observations, and missing neutral exact-context retrieval. Regression tests were added for each corrected boundary.

After the final fixes, both reviewers returned `PASS`. They independently verified the unit tests, accepted live-report test, generated artifacts, exact neutral-context retrieval, unknown-context fallback, hypothesis-only policy, and the 118-check blind Agent comparison.
