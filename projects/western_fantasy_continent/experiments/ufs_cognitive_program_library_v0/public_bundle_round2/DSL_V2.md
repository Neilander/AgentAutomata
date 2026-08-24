# UFS认知JSON小程序DSL V2（隔离作者公共合同）

你编写的是AI从规则形成的、可保存和修订的认知绑定程序。程序只读取当前注意已经暴露的路径，只在imaginedWorld形成patch；不执行真实引擎动作。

每个程序严格包含：

```json
{
  "programId": "稳定语义ID，不含版本号",
  "revision": 1,
  "sourceRuleIds": ["来源规则ID"],
  "trigger": {"qKind": "任务指定值", "relation": {}},
  "requiredReads": ["任务允许的注意路径"],
  "bindings": {"变量名": {"op": "..."}},
  "output": {"kind": "任务指定值", "fields": {}}
}
```

`bindings`按JSON字段顺序执行。后面的binding可以引用前面的变量。

普通JSON值、数组和不含`op`的对象是字面模板，内部表达式仍递归求值。只允许：

```text
read(path) / read_template(template) / var(name) / get(from,key)
map(items,as,value) / filter(items,as,where) / length(value)
first(items) / pluck(items,key) / unique(items) / concat(items)
eq(left,right) / not(value) / and(values) / or(values)
lte(left,right) / gte(left,right) / contains(items,value)
add(values) / subtract(left,right) / min(values) / max(values) / sum(items)
if(condition,then,else)
```

使用完整JSON形式，例如：

```json
{"op":"gte","left":{"op":"read","path":"player.energy"},"right":{"op":"read","path":"room.energyCost"}}
```

`map`/`filter`的`as`变量只在内部表达式有效。`read_template`使用`${变量名}`替换当前局部变量，例如`sky.column:${columnId}.shipIds`。

硬限制：

- 只能使用任务文件列出的注意路径；动态路径必须原样列入`requiredReads`。
- 不得写JavaScript、Python、正则、函数体或任意代码字符串。
- 不得读取场景、引擎、测试、现有轨迹、程序库、其他Agent提交或仓库其他文件。
- 不得编造随机结果；随机必须输出任务指定的unknown和stop。
- 规则不足时保守输出选择、约束或未知，不能用常识补全。
