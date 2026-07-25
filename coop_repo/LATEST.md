# Coop Handoff Entry Point

不要把这个文件当成唯一事实来源；它会随着协作进度更新。

先读时间戳报告索引：

[`REPORT_INDEX.md`](REPORT_INDEX.md)

当前最新工作报告：

[`reports/2026-07-24_1711_mind-toy-graded-map-blur.md`](reports/2026-07-24_1711_mind-toy-graded-map-blur.md)

Last updated: 2026-07-24

当前重点：地图有限注意不能实现为随机遮挡。研究支持四种并存机制：未注意信息完全不进入模型、相似单位压成群体统计、负荷增加使个体精度连续下降、类型与位置可能绑定错误。第一版建议只做instance/group/gist三层和高负荷下的小概率绑定错误；下一步用固定3区域、8~12敌人的小地图，只改变目标与焦点，检查真实Agent输出如何渐进模糊。
