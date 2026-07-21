# 封存盲测第三轮报告

- 全部严格样本 Top-1：11/20（55%）
- 全部严格样本 Top-3：17/20（85%）
- 有可观察事件 Top-1：11/16（69%）
- 有可观察事件 Top-3：16/16（100%）

## 各类结果

| 类别 | 样本 | Top-1 | Top-3 |
|---|---:|---:|---:|
| anger | 3 | 67% | 100% |
| disgust | 3 | 0% | 100% |
| fear | 3 | 67% | 100% |
| guilt | 2 | 0% | 0% |
| joy | 3 | 100% | 100% |
| sadness | 3 | 100% | 100% |
| shame | 3 | 33% | 67% |

## Top-3 失败

- isear-37398a30abb73b3abc27：答案 guilt，模型 anger(0) / disgust(0) / fear(0)
  - 事件：I have not felt this emotion in my life.
- isear-12c3475b14e8b21c3918：答案 guilt，模型 anger(0) / disgust(0) / fear(0)
  - 事件：Not applicable to myself.
- isear-73102daf996e138bd165：答案 shame，模型 anger(0) / disgust(0) / fear(0)
  - 事件：I have not felt this emotion in my life.

- 预测先冻结、后揭盲；第三轮与前两轮来源组完全隔离。
- 正式玩家 Agent 未修改。
