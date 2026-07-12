# Player Model Vertex Audit

- Model: cognition-v5-sandbox-1
- Seeds per vertex: 24
- Construct tests passed: 21/30
- Coefficient tests passed: 27/27

| Parameter | Verdict | Tests | Channels |
|---|---|---|---|
| P.W | pass | p_enemy_hp, p_travel_wait | emotion |
| P.total | pass | p_enemy_hp, p_travel_wait, p_decision_chain | emotion |
| feedback.stock | pass | p_enemy_hp, p_travel_wait | emotion |
| P.E_decision | pass | p_decision_chain | emotion |
| P.E | pass | p_decision_chain | emotion |
| Q.total | pass | p_decision_chain, q_perceptual_clarity, q_causal_clarity | emotion |
| P.E_verify | pass | p_verification | emotion |
| R.verification | pass | p_verification | emotion |
| R.total | pass | p_verification, r_progression_amount, r_progression_freshness, r_verification_freshness | emotion |
| H.perceptual | pass | q_perceptual_clarity | emotion |
| Q.process_feedback | pass | q_perceptual_clarity, q_dead_repetition, q_incomprehension | emotion |
| H.causal | pass | q_causal_clarity | emotion |
| R.progression | pass | q_causal_clarity, q_progress_readability | emotion |
| Q.progress_readability | pass | q_progress_readability | emotion |
| Q.dead_repetition | pass | q_dead_repetition | emotion |
| Q.incomprehension | pass | q_incomprehension | emotion |
| H.salience | limited | h_salience | diagnostic_only |
| experience.total | fail | h_salience, h_goal_relevance, r_other_result | diagnostic_only, emotion |
| H.goal | limited | h_goal_relevance | diagnostic_only |
| R.progression_amount | pass | r_progression_amount | emotion |
| A.mismatch | pass | r_progression_amount, r_other_result | emotion |
| R.progression_freshness | pass | r_progression_freshness | emotion |
| R.growth.typical | pass | r_growth_bundle | emotion |
| R.growth.peak | pass | r_growth_bundle, r_growth_peak | emotion |
| R.growth.impact | pass | r_growth_bundle, r_growth_impact | emotion |
| R.growth.total | pass | r_growth_bundle, r_growth_frequency, r_growth_peak, r_growth_impact, r_growth_freshness | emotion |
| R.growth.frequency | pass | r_growth_frequency | emotion |
| R.growth.baseline_confidence | pass | r_baseline_confidence | emotion |
| R.growth.freshness | pass | r_growth_freshness | emotion |
| R.verification_freshness | pass | r_verification_freshness | emotion |
| R.other_result | pass | r_other_result | emotion |
| A.positive_mismatch | pass | a_positive_mismatch | emotion |
| A.total | pass | a_positive_mismatch, a_negative_mismatch | emotion |
| A.negative_mismatch | pass | a_negative_mismatch | emotion |
| Agency.desire | limited | agency_desire | diagnostic_only |
| Agency.desire.behavioral_effect | fail | agency_desire | diagnostic_only |
| Agency.gap | limited | agency_gap | diagnostic_only |
| Agency.gap.behavioral_effect | fail | agency_gap | diagnostic_only |
| Agency.clarity | limited | agency_clarity | diagnostic_only |
| Agency.clarity.behavioral_effect | fail | agency_clarity | diagnostic_only |
| Agency.path | limited | agency_path | diagnostic_only |
| Agency.path.behavioral_effect | fail | agency_path | diagnostic_only |
| Agency.causal | limited | agency_causal_control | diagnostic_only |
| Agency.causal.behavioral_effect | fail | agency_causal_control | diagnostic_only |
| Agency.improvement | limited | agency_improvement | diagnostic_only |
| Agency.improvement.behavioral_effect | fail | agency_improvement | diagnostic_only |
| Agency.cost | limited | agency_cost | diagnostic_only |
| Agency.cost.behavioral_effect | fail | agency_cost | diagnostic_only |
| coefficient.initialFeedbackStock | limited | coefficient:initialFeedbackStock | formula_sensitivity |
| coefficient.abandonThreshold | limited | coefficient:abandonThreshold | formula_sensitivity |
| coefficient.stockDecayPerSecond | limited | coefficient:stockDecayPerSecond | formula_sensitivity |
| coefficient.cognitiveProcessWeight | limited | coefficient:cognitiveProcessWeight | formula_sensitivity |
| coefficient.wProcessWeight | limited | coefficient:wProcessWeight | formula_sensitivity |
| coefficient.k | limited | coefficient:k | formula_sensitivity |
| coefficient.q.baseWithDecision | limited | coefficient:q.baseWithDecision | formula_sensitivity |
| coefficient.q.noDecisionBase | limited | coefficient:q.noDecisionBase | formula_sensitivity |
| coefficient.q.clarityWeight | limited | coefficient:q.clarityWeight | formula_sensitivity |
| coefficient.q.causalWeight | limited | coefficient:q.causalWeight | formula_sensitivity |
| coefficient.q.progressWeight | limited | coefficient:q.progressWeight | formula_sensitivity |
| coefficient.q.deadRepetitionPenalty | limited | coefficient:q.deadRepetitionPenalty | formula_sensitivity |
| coefficient.q.incomprehensionPenalty | limited | coefficient:q.incomprehensionPenalty | formula_sensitivity |
| coefficient.result.progressionScale | limited | coefficient:result.progressionScale | formula_sensitivity |
| coefficient.result.growthScale | limited | coefficient:result.growthScale | formula_sensitivity |
| coefficient.result.peakGrowthWeight | limited | coefficient:result.peakGrowthWeight | formula_sensitivity |
| coefficient.result.impactGrowthWeight | limited | coefficient:result.impactGrowthWeight | formula_sensitivity |
| coefficient.result.verificationBase | limited | coefficient:result.verificationBase | formula_sensitivity |
| coefficient.mismatch.positiveScale | limited | coefficient:mismatch.positiveScale | formula_sensitivity |
| coefficient.mismatch.positivePower | limited | coefficient:mismatch.positivePower | formula_sensitivity |
| coefficient.mismatch.negativeScale | limited | coefficient:mismatch.negativeScale | formula_sensitivity |
| coefficient.mismatch.negativePower | limited | coefficient:mismatch.negativePower | formula_sensitivity |
| coefficient.freshnessLambda | limited | coefficient:freshnessLambda | formula_sensitivity |
| coefficient.familyFreshnessWeight | limited | coefficient:familyFreshnessWeight | formula_sensitivity |
| coefficient.magnitudeSurpriseWeight | limited | coefficient:magnitudeSurpriseWeight | formula_sensitivity |
| coefficient.breakthroughWeight | limited | coefficient:breakthroughWeight | formula_sensitivity |
| coefficient.baselineAlpha | limited | coefficient:baselineAlpha | formula_sensitivity |

## Failed Vertex Checks

### h_salience

Increase visual salience without changing information

- experience.total: expected >= +0.01, observed delta 0
### h_goal_relevance

Make the same signal directly relevant to the active goal

- experience.total: expected >= +0.01, observed delta 0
### agency_desire

Increase desire for the active goal

- Agency.desire.behavioral_effect: expected >= +0.01, observed delta 0
### agency_gap

Make the perceived gap meaningful

- Agency.gap.behavioral_effect: expected >= +0.01, observed delta 0
### agency_clarity

Clarify the current problem

- Agency.clarity.behavioral_effect: expected >= +0.01, observed delta 0
### agency_path

Reveal a path to improvement

- Agency.path.behavioral_effect: expected >= +0.01, observed delta 0
### agency_causal_control

Increase trust that the action causes the result

- Agency.causal.behavioral_effect: expected >= +0.01, observed delta 0
### agency_improvement

Increase expected improvement from the action

- Agency.improvement.behavioral_effect: expected >= +0.01, observed delta 0
### agency_cost

Reduce perceived action cost

- Agency.cost.behavioral_effect: expected >= +0.01, observed delta 0
