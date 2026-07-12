# Complex Model vs P/R-only Ablation

The simple score is a deliberate P/R-only ablation (R - time decay), not a reconstruction of a historical model version.

- Tests: 30
- Added discrimination from complex model: 4
- Blind in both models: 9
- Same direction: 17
- Different direction: 0

| Test | Complex delta | Simple delta | Result |
|---|---:|---:|---|
| p_enemy_hp | 1.8521 | 1.2438 | same_direction |
| p_travel_wait | 1.6319 | 1.05 | same_direction |
| p_decision_chain | 2.1038 | 0 | complex_only |
| p_verification | 2.8035 | 1.2 | same_direction |
| q_perceptual_clarity | 0.88 | 0 | complex_only |
| q_causal_clarity | 1.3677 | 0.27 | same_direction |
| q_progress_readability | 1.2786 | 0.287 | same_direction |
| q_dead_repetition | 2.165 | 0 | complex_only |
| q_incomprehension | 3.942 | 0 | complex_only |
| h_salience | 0 | 0 | both_blind |
| h_goal_relevance | 0 | 0 | both_blind |
| r_progression_amount | 0.9828 | 0.405 | same_direction |
| r_progression_freshness | 0.4934 | 0.202 | same_direction |
| r_growth_bundle | 3.8262 | 1.9801 | same_direction |
| r_growth_frequency | 3.0703 | 1.3197 | same_direction |
| r_growth_peak | 1.5483 | 0.6555 | same_direction |
| r_growth_impact | 0.6388 | 0.2749 | same_direction |
| r_baseline_confidence | 2.4176 | 1.0624 | same_direction |
| r_growth_freshness | 1.2077 | 0.5298 | same_direction |
| r_verification_freshness | 2.3277 | 0.96 | same_direction |
| r_other_result | 4.6868 | 2 | same_direction |
| a_positive_mismatch | 8.2474 | 4 | same_direction |
| a_negative_mismatch | -8.3535 | -3.506 | same_direction |
| agency_desire | 0 | 0 | both_blind |
| agency_gap | 0 | 0 | both_blind |
| agency_clarity | 0 | 0 | both_blind |
| agency_path | 0 | 0 | both_blind |
| agency_causal_control | 0 | 0 | both_blind |
| agency_improvement | 0 | 0 | both_blind |
| agency_cost | 0 | 0 | both_blind |

## Interpretation

`complex_only` means Q/A/decision structure adds information that a time-plus-result model cannot see.
`both_blind` means the current complex model still does not connect that construct to experience or behavior.
`same_direction` means the complex model may improve magnitude or attribution, but the extra structure is not required to detect direction.
