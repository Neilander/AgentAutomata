# Human Plausibility Review V3

- Reviewer: second-round independent human plausibility review
- Scope: V3 player records, V3 raw JSON, selected lock-key cognition rules, and V2 raw player records for comparison
- Write constraint: review only; no model changes

## Verdict

**verdict: revise**

V3 improves several V2 issues, especially emotional label lag and the timing of targeted equipment knowledge. However, it still overstates the efficient-route stop as if the route deterministically abandons after the second prison failure. The raw JSON shows a low-probability stochastic abandon hit, not a mechanism-certain route break: second efficient prison failure has `abandonProbability: 0.071`, `abandonRoll: 0.032`, `abandoned: true`. That distinction must be explicit in the player record and any downstream conclusion.

## Findings By Severity

### High - Random Tail Event Is Treated Like Deterministic Failure

Evidence:

- `/tmp/wfc-feedback-efficient-v3.json`, second prison failure: `feedbackAtFailure: 36.333`, `localFailureCount: 2`, `abandonProbability: 0.071`, `abandonRoll: 0.032`, `abandoned: true`.
- Same file, first prison failure: `abandonProbability: 0.018`, `abandonRoll: 0.239`, `abandoned: false`.
- V3 efficient report says the system marked `abandoned=true` after the second prison failure and concludes the player ultimately abandons.

Problem class: low-probability stochastic abandon vs mechanism-certain abandon are mixed.

Why it matters: a 7.1% abandon probability means this seed landed in the tail. It supports "there is some risk after two long failures", but not "the efficient player normally quits here" or "the map necessarily fails before camp/targeted gear".

Verifiable modification:

- Rewrite the efficient V3 conclusion to say: "This seed abandoned on a 7.1% roll (`0.032 < 0.071`); batch runs are required before treating two-prison-failure abandon as typical."
- Add a small batch check or at minimum a note that 92.9% of identical-probability rolls would continue past this exact check.

### Medium - Emotion Label Lag Improved, But "Abandoned" Is Too Sharp As An Emotion Label

Evidence:

- Explorer V2 had clear lag: second prison failure went `53.085 / 投入 -> 23.08 / 疲惫且受挫`, then recovery stayed low; later wins remained "投入" while value declined.
- Efficient V2 stayed "平稳" at `30.106` and only switched to "疲惫" at `11.077`.
- V3 improved early failure labels: first prison losses drop sharply but remain `投入`, which is plausible because feedback remains `55.218` or `61.57` and mainline/camp paths remain open.
- Efficient V3 step 6 goes `61.908 / 投入 -> 36.333 / 已放弃`. The label is driven by the abandon roll, not by the feedback value alone.

Problem class: emotion, decision state, and stochastic abandonment are partly conflated.

Verifiable modification:

- Keep `已放弃` as a terminal state only after the abandon check, but record the pre-roll emotion separately, likely `平稳/受挫` rather than "abandoned as emotion".
- Add fields or prose like `preAbandonEmotion` and `abandonDecision`.

### Medium - Targeted Equipment Knowledge Appears At The Right Time In Explorer, But Efficient V3 Stops Before Testing It

Evidence:

- Lock-key cognition requires no designer knowledge before taught concepts, and says failure attribution must use known concepts only.
- V3 explorer step 6 correctly says bandit/camp becomes visible with "fixed shield-break/armor-break gear"; prison hint already mentions shield, so choosing camp next would be knowledge-bounded.
- Efficient V3 step 6 abandons before camp appears or before `r1_main_5`; this is a valid seed outcome but not proof that targeted equipment teaching is absent.
- V2 explorer validates the intended chain: after main 5, camp reward "破盾斧与裂甲护手" naturally answers "狱门护盾", then prison succeeds and unlocks ranger/team-change knowledge.

Problem class: correct timing in one route, incomplete evidence in stochastic-abandoned route.

Verifiable modification:

- Mark efficient V3 as "tail abandoned before observing the camp teaching moment", not as evidence that targeted equipment knowledge failed globally.
- Compare with a continued or non-abandoned efficient seed before revising the camp/prison teaching chain.

### Medium - 40% Failure Recovery Is Plausible But Needs Attribution Boundaries

Evidence:

- Reference section 10 states failure restores related event freshness by `recovery_per_failure = 0.40`, only through current attribution.
- Explorer V3 after prison failure: gear-related events recover enough that mainline wins from gear `165 -> 240 -> 295` plausibly wake prison memory.
- Efficient V3 after first failure: gear `159 -> 220` is +38%, so retry is plausible under the +30% wake line used in V2/V3 records.

Problem class: generally plausible, but recovery can blur into "all combat feels new again" unless related events are constrained.

Verifiable modification:

- In trace diagnostics, list which event families recovered after prison failure. It should be equipment/power/main progress/retry desire, not unrelated skill casts or generic freshness.

### Low - Blue-Gear Miss Penalty Looks Reasonable

Evidence:

- Both V3 JSON files record expectation `blue_drop:r1_main_3:3`, strength `0.4`, status `missed`, contribution `expectation:missed = -1.6`.
- The penalty is visible but small relative to simultaneous main clear, gear gain, and side-branch discovery.
- This matches V2 player notes: the miss matters more later when fatigue is high; early on it is softened by new branch/character curiosity.

Problem class: acceptable calibration.

Verifiable modification:

- No immediate model change needed. Keep watching later "possible blue gear" misses under low feedback, where the same -1.6 may understate disappointment.

### Low - danger/team verification/role proof Are Reasonable Additions, But Not Yet Exercised In V3

Evidence:

- V3 config contains `survive:danger_window`, `verify:team_change`, and `proof:role_contribution`.
- V3 partial routes end before ranger unlock, team change, and role proof.
- V2 records show these concepts are needed later: ranger unlock, swapping out weak militia, and subsequent damage contribution verification make the role lesson human-plausible.

Problem class: reasonable model vocabulary, insufficient V3 coverage.

Verifiable modification:

- Do not claim V3 validates `verify:team_change` or `proof:role_contribution` until a continued route reaches ranger/team-change.
- Ensure long combat uses `danger_window` only for actually perceivable near-loss/survival moments, not as generic compensation for duration.

### Low - Remaining Concept Mixing

Evidence:

- V3 anomalies sometimes describe "emotional stock barely holds", "normal kill/heal feedback starts exhausting", and "reward fatigue" in the same breath.
- Efficient V3 combines second failure, feedback value `36.333`, two long 31-32s failures, local failure count 2, and a lucky low roll into one "已放弃" outcome.

Problem class: inventory state, freshness, fatigue, frustration, expectation, and abandon decision still blur in prose.

Verifiable modification:

- Separate these in future records:
  - inventory/power: gear score and equipment specificity;
  - freshness: event family trigger/freshness;
  - fatigue: long no-positive-feedback intervals and repeated combat;
  - frustration: failure memory and near-miss quality;
  - expectation: blue-drop fulfilled/missed;
  - abandon: probability and seeded roll.

## Bottom Line

V3 is directionally better and mostly human-plausible, but it needs revision before acceptance. The critical fix is to label the efficient route's abandon as a seeded 7.1% tail event (`roll 0.032`) rather than a deterministic conclusion about the route.
