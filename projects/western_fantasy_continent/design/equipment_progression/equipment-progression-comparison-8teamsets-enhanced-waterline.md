# Equipment Progression Comparison - 8 Different Team Sets

Generated at: 2026-07-01T04:51:17.419Z

## 每次模拟的可能结论

| Run | 队伍组合 | 终局 平均/最高/最低 | 差距峰值 | 可能结论 |
| --- | --- | --- | ---: | --- |
| s1_front_spell | 低血狂战 / 火法燃烧 / 铁壁反击 | 0.81/1/0.65 | 0.5 | 平均成长明显<br>最高队接近封顶<br>含火法时容易出现封顶队 |
| s2_status_execute | 剧毒绽放 / 暗影处决 / 圣光续航 | 0.593/0.95/0.32 | 0.66 | 平均成长偏弱或中等<br>最高队接近封顶<br>最低队追赶不足<br>过程分化严重<br>含刺杀时稳定性需要观察 |
| s3_dot_front | 火法燃烧 / 剧毒绽放 / 铁壁反击 | 0.9/1/0.72 | 0.54 | 平均成长明显<br>最高队接近封顶<br>含火法时容易出现封顶队 |
| s4_risk_burst_sustain | 低血狂战 / 暗影处决 / 圣光续航 | 0.503/0.67/0.36 | 0.42 | 平均成长偏弱或中等 |
| s5_defensive_shells | 铁壁反击 / 圣光续航 / 低血狂战 | 0.557/0.73/0.31 | 0.45 | 平均成长偏弱或中等<br>最低队追赶不足<br>含铁壁时可能有短板风险 |
| s6_damage_shells | 火法燃烧 / 剧毒绽放 / 暗影处决 | 0.827/1/0.49 | 0.58 | 平均成长偏弱或中等<br>最高队接近封顶<br>含火法时容易出现封顶队 |
| s7_spell_execute_sustain | 火法燃烧 / 暗影处决 / 圣光续航 | 0.603/1/0.3 | 0.72 | 平均成长偏弱或中等<br>最高队接近封顶<br>最低队追赶不足<br>过程分化严重<br>含火法时容易出现封顶队<br>含刺杀时稳定性需要观察 |
| s8_pressure_front | 低血狂战 / 剧毒绽放 / 铁壁反击 | 0.817/0.99/0.69 | 0.5 | 平均成长明显<br>最高队接近封顶 |

## 对比分析过程

### 装备循环在不同队伍组合下仍有成长感

- Supported by: s1_front_spell, s3_dot_front, s5_defensive_shells, s6_damage_shells, s8_pressure_front
- Contradicted by: s2_status_execute, s4_risk_burst_sustain, s7_spell_execute_sustain
- Confidence: high

### 最高队封顶是跨队伍组合的稳定现象

- Supported by: s1_front_spell, s2_status_execute, s3_dot_front, s6_damage_shells, s7_spell_execute_sustain, s8_pressure_front
- Contradicted by: s4_risk_burst_sustain, s5_defensive_shells
- Confidence: high

### 最低队追赶不足仍然存在，但强度依赖队伍组合

- Supported by: s2_status_execute, s4_risk_burst_sustain, s5_defensive_shells, s7_spell_execute_sustain
- Contradicted by: s1_front_spell, s3_dot_front, s6_damage_shells, s8_pressure_front
- Confidence: medium-high

### 火法是最常见的封顶来源

- Supported by: s1_front_spell, s3_dot_front, s6_damage_shells, s7_spell_execute_sustain
- Contradicted by: -
- Confidence: high

### 铁壁/刺杀更容易落成短板或波动源

- Supported by: s2_status_execute, s5_defensive_shells, s7_spell_execute_sustain
- Contradicted by: s1_front_spell, s3_dot_front, s4_risk_burst_sustain, s6_damage_shells, s8_pressure_front
- Confidence: medium

## 汇总指标

- 平均终局平均分: 0.701
- 平均终局最高分: 0.917
- 平均终局最低分: 0.48
- 平均最大差距: 0.546
- 最能拉最低队: 双DOT铁壁 (0.72)
- 平均分最高: 双DOT铁壁 (0.9)
- 终局差距最低: 双DOT铁壁 (0.28)

## 最终结论

- 不同队伍组合下，装备循环依然能提供成长。
- 最高队封顶比最低队追赶更稳定，是当前循环的第一问题。
- 最低队追赶不足不是单一经济公式能解决，和队伍/流派吃装备能力有关。
- 下一步应做封顶衰减和按队伍短板的定向掉落，而不是只改全局掉落质量。

## 建议下一步

- 做封顶衰减：最高队水桶分超过 0.85 后，最高分权重逐步转移给平均分和最低分。
- 做短板定向掉落：最低队低于平均队 0.25 以上时，提高该队适配词条或装备分配权重。
- 单独检查火法为什么最容易封顶，以及铁壁/刺杀为什么容易成为短板或波动源。
