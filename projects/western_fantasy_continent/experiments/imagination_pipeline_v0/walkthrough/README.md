# 模拟玩家设想流水线 Walkthrough

这是 `imagination_pipeline_v0` 的独立可交互审计页。它展示当前问题 1—6 拼接的完整微型案例：

```text
候选放骰
→ 有限注意
→ 五槽 Q
→ 矩阵轨迹激活
→ 关系核对
→ 当前对象与参数绑定
→ imaginedWorld 补丁
→ 连续设想与明确停止
```

页面特意把 `observedWorld` 与 `imaginedWorld` 并排显示，并提供每一步的输入、产出、读取路径、被拒绝联想、世界补丁和停止原因。

## 使用

从仓库根目录重新生成页面数据：

```powershell
node projects/western_fantasy_continent/experiments/imagination_pipeline_v0/walkthrough/build-walkthrough-data.js
```

随后直接打开：

```text
projects/western_fantasy_continent/experiments/imagination_pipeline_v0/walkthrough/index.html
```

页面不依赖网络或构建工具，可以通过 `file://` 直接运行。键盘左右方向键切换步骤，空格开始或暂停自动播放。

有 Playwright 环境时可以运行浏览器交互检查：

```powershell
node projects/western_fantasy_continent/experiments/imagination_pipeline_v0/walkthrough/qa-walkthrough.js
```

## 数据来源与边界

- `walkthrough-data.json` 与 `walkthrough-data.js` 都由现有 `ImaginationPipeline` 运行结果生成。
- 当前只展示 `place_die` 的同构微型案例，不代表正式游戏玩家已经接入。
- 当前激活编码器仍是确定性测试编码器，不是真实 GTE。
- 页面不会调用或修改正式玩家运行时。
- 页面不会修改 `observedWorld`；世界变化只来自可审计的 `imaginedWorld` 补丁。
- 问题 7 的候选动作生成/比较与问题 8 的反馈学习不在当前范围内。

## 扩展方式

后续新增动作或场景时，优先扩展 `build-walkthrough-data.js` 生成的 `steps`，不要把新的演示结果直接硬编码进 `app.js`。界面层只负责渲染稳定的数据合同。
