# Equipment Progression Comparison - 8 Runs

Generated at: 2026-07-01T03:27:53.154Z

## 每次模拟的可能结论

| Run | 规则 | 终局 平均/最高/最低 | 差距峰值 | 可能结论 |
| --- | --- | --- | ---: | --- |
| s1_baseline | 基准 | 0.681/1/0.417 | 0.75 | 平均成长足够明显<br>最高队封顶，继续奖励最高分会浪费或扩大差距<br>队伍分化严重，需要 catch-up 或封顶衰减 |
| s2_seed_check | 同规则换随机种子 | 0.653/1/0.333 | 0.75 | 平均成长足够明显<br>最高队封顶，继续奖励最高分会浪费或扩大差距<br>最低队仍低，弱队追赶不足<br>队伍分化严重，需要 catch-up 或封顶衰减 |
| s3_best_heavy | 最高队权重更高 | 0.694/1/0.5 | 0.75 | 平均成长足够明显<br>最高队封顶，继续奖励最高分会浪费或扩大差距<br>队伍分化严重，需要 catch-up 或封顶衰减<br>偏最高队权重会强化头部滚雪球 |
| s4_worst_heavy | 最低队权重更高 | 0.653/1/0.333 | 0.75 | 平均成长足够明显<br>最高队封顶，继续奖励最高分会浪费或扩大差距<br>最低队仍低，弱队追赶不足<br>队伍分化严重，需要 catch-up 或封顶衰减 |
| s5_average_heavy | 平均队权重更高 | 0.625/1/0.333 | 0.917 | 最高队封顶，继续奖励最高分会浪费或扩大差距<br>最低队仍低，弱队追赶不足<br>队伍分化严重，需要 catch-up 或封顶衰减 |
| s6_more_drops | 单位时间更多装备 | 0.625/1/0.333 | 0.75 | 平均成长足够明显<br>最高队封顶，继续奖励最高分会浪费或扩大差距<br>最低队仍低，弱队追赶不足<br>队伍分化严重，需要 catch-up 或封顶衰减 |
| s7_fewer_drops | 单位时间更少装备 | 0.625/0.958/0.375 | 0.75 | 最高队封顶，继续奖励最高分会浪费或扩大差距<br>队伍分化严重，需要 catch-up 或封顶衰减<br>低掉落用于判断装备数量本身的贡献 |
| s8_bigger_waterline_sample | 高战水桶样本更大 | 0.625/1/0.325 | 0.85 | 平均成长足够明显<br>最高队封顶，继续奖励最高分会浪费或扩大差距<br>最低队仍低，弱队追赶不足<br>队伍分化严重，需要 catch-up 或封顶衰减 |

## 对比分析过程

### 装备循环有明确成长感

- Supported by: s1_baseline, s2_seed_check, s3_best_heavy, s4_worst_heavy, s5_average_heavy, s6_more_drops, s7_fewer_drops, s8_bigger_waterline_sample
- Contradicted by: -
- Confidence: high

### 最高队过早接近或达到高战水桶上限

- Supported by: s1_baseline, s2_seed_check, s3_best_heavy, s4_worst_heavy, s5_average_heavy, s6_more_drops, s7_fewer_drops, s8_bigger_waterline_sample
- Contradicted by: -
- Confidence: high

### 最低队追赶不足是结构性问题

- Supported by: s2_seed_check, s4_worst_heavy, s5_average_heavy, s6_more_drops, s7_fewer_drops, s8_bigger_waterline_sample
- Contradicted by: s1_baseline, s3_best_heavy
- Confidence: medium-high

### 单纯增加装备数量会提升全队，但不一定降低分化

- Supported by: s6_more_drops
- Contradicted by: s7_fewer_drops
- Confidence: medium

## 汇总指标

- 平均终局平均分: 0.648
- 平均终局最高分: 0.995
- 平均终局最低分: 0.369
- 平均最大差距: 0.783
- 最能拉最低队: 最高队权重更高 (0.5)
- 平均分最高: 最高队权重更高 (0.694)
- 终局差距最低: 最高队权重更高 (0.5)

## 最终结论

- 当前反馈循环能产生装备成长感。
- 最大风险不是无成长，而是主力队过早封顶，同时弱队仍然落后。
- 下一版应加入最高分边际递减或最低队 catch-up，而不是继续单纯提高掉落质量。

## 建议下一步

- 做一版封顶衰减：当最高队水桶分超过 0.85 后，最高分权重逐步转移给平均分和最低分。
- 做一版弱队追赶：最低队低于平均队 0.25 以上时，提高该队装备分配或该队专属掉落权重。
- 再跑 8 次同样比较，检查平均成长是否保持，同时最大差距是否降到 0.45 以下。
