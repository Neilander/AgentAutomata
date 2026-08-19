# 参数化移动预览公开合同

这是一个新建的同构微实验，不是原 UFS 规则原文。

你要维护 `submission/submission.js`。该文件必须导出：

```javascript
module.exports = {
  SOURCE_RULE_IDS: [/* str */],
  REVISION: "...",
  preview(state) { /* ... */ },
};
```

`preview(state)` 接收只读公开状态并返回普通效果数组。允许输入：

```text
state.event.type: str
state.event.column: str
state.event.amount: int
state.event.selection: 可选 str
state.objects: 只读序列
每个对象公开字段：id: str, column: str, row: int, frozen: bool,
                     city_distance: 可选非负 int
```

输出中的每个效果必须恰为：

```javascript
{"object_id": str, "from_row": int, "to_row": int}
```

输出沿输入对象顺序排列。输入事件不是 `place_die` 时返回空列表。函数不得修改输入。

安全边界：

- 只能依据本 bundle 内截至当前轮公开的合同、规则和可见反例。
- 不得读取 bundle 之外任何仓库文件；不得搜索仓库。
- 不得读取或猜测 oracle、隐藏案例、隐藏期望或旧实验答案。
- submission 不得进行文件、网络、环境变量、进程、反射、动态代码执行或模块导入（包括 `require`/`import`）。
- 不得枚举未知键；只按公开合同读取需要的字段。
- `SOURCE_RULE_IDS` 必须只列出实际实现的公开规则 ID，且顺序与规则公开顺序一致。
- 每轮做局部、可追溯修订，不针对单一示例硬编码对象 ID 或数字。
