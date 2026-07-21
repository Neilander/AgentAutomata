# 封存盲测第二轮报告

- 严格样本：22
- 联合 Top-1：10/22（45%）
- 联合 Top-3：17/22（77%）
- 即时 Top-3：17/22（77%）
- 稳定 Top-3：18/22（82%）

## 各类结果

| 类别 | 样本 | Top-1 | Top-3 |
|---|---:|---:|---:|
| anger | 4 | 75% | 100% |
| disgust | 4 | 25% | 75% |
| fear | 4 | 25% | 75% |
| guilt | 2 | 0% | 0% |
| joy | 1 | 100% | 100% |
| sadness | 4 | 75% | 100% |
| shame | 3 | 33% | 67% |

## Top-3 失败

- isear-441e0544661d962b1e4e：答案 disgust，模型 shame(0.322) / anger(0.278) / guilt(0.217)
  - 事件：When I made love with someone who I didn't really love. Sometimes I even considered him unlikable.
- isear-1820e2c684abd64de1a5：答案 shame，模型 anger(0) / disgust(0) / fear(0)
  - 事件：Do not remember any incident.
- isear-1090568abc285ff694a8：答案 fear，模型 anger(0.615) / disgust(0.4) / sadness(0.297)
  - 事件：Beaten up by a classmate in school.
- isear-a4d29f1662aa262afacd：答案 guilt，模型 anger(0) / disgust(0) / fear(0)
  - 事件：Do not remember any incident.
- isear-3029c5055a04144cded0：答案 guilt，模型 shame(0.301) / anger(0.277) / sadness(0.166)
  - 事件：Not handing in homework in time.

## 边界

- 第二轮来自第一轮完全未使用的来源组，冻结预测后才揭晓答案。
- 4 条“想不起事件”仍计入分母；它们不适合验证事件生成模型，会单独报告含/不含脏样本成绩。
- 正式玩家 Agent 未修改。
