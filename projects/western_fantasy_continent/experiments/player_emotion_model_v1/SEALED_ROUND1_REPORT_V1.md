# 封存盲测第一轮报告

- 严格样本：34
- 联合 Top-1：17/34（50%）
- 联合 Top-3：28/34（82%）
- 即时 Top-3：28/34（82%）
- 稳定 Top-3：29/34（85%）

## 各类结果

| 类别 | 样本 | Top-1 | Top-3 |
|---|---:|---:|---:|
| anger | 4 | 50% | 100% |
| disgust | 5 | 20% | 40% |
| fear | 4 | 75% | 100% |
| guilt | 5 | 0% | 60% |
| joy | 6 | 100% | 100% |
| sadness | 6 | 83% | 100% |
| shame | 4 | 0% | 75% |

## Top-3 失败

- isear-b05314b26b1e61beae39：答案 guilt，模型 joy(0.362) / sadness(0.247) / anger(0.07)
  - 事件：At a party, I started talking to a guy I had seen in one of my classes. My boyfriend felt awkward and left to talk to a friend but kept on looking at me as I talked.
- isear-8af663a533ba5389388a：答案 disgust，模型 anger(0.402) / sadness(0.317) / fear(0.29)
  - 事件：One of my good friends told people something I had told her in confidence about someone else.
- isear-06b882049d2d4adbe74d：答案 guilt，模型 sadness(0.38) / joy(0.341) / anger(0.236)
  - 事件：My mother wrote me and said that I would not writ enough letters home.
- isear-9112afe9e88e1847bedb：答案 disgust，模型 anger(0.371) / fear(0.323) / sadness(0.286)
  - 事件：Class leader getting me to do things he did not want to do.
- isear-d6fd6015ad1af616fa31：答案 shame，模型 sadness(0.354) / anger(0.203) / guilt(0.128)
  - 事件：Not quick enough to help the lectors to catty things for the lecture.
- isear-928f2fe68c29fd662662：答案 disgust，模型 anger(0.647) / sadness(0.646) / fear(0.494)
  - 事件：On school, during a fancy fair, there was a stand of amnesty international. There I read (for the first time) a description of the tortures of a woman, what they did to her.

## 诚实边界

- 这批答案在结构化输入和预测哈希冻结后才揭开，是真揭盲，不是发现集回放。
- 同一开发者仍然兼任了答案不可见的事件整理者，因此不是独立双人盲测。
- 揭盲以后这 34 条已经转为开发资料，后续修改只能去剩余来源组重新测。
- 正式玩家 Agent 没有接入或修改。
