# 玩家路径审查

## User frame

User: 第一次进入灰谷村第3日的玩家。  
Intent: 在有限行动中决定建设、招募、刷装或突袭，并为第7日备战。  
Prior knowledge: 已知敌军规模、粮食发挥区间、人口与民兵关系。  
Success state: 能完成一次经营、一次配装、一次突袭，并理解战后局势变化。

## Task path

### 1. 找到今天的目标

- User expects: 先看到还有几日、多少行动、敌我规模。
- UI must show: 顶部七日轨、外置行动力、左上战争牌。
- Action available: 点击任一带数字的地图节点。
- Feedback after action: 节点旁浮层只显示该地点合法行动。
- Recovery if wrong: 点击空白、关闭按钮或 Escape 退出浮层。

### 2. 建设或升级

- User expects: 看成本、完工时间、产量范围。
- UI must show: 空地三种建筑；已建建筑只显示自己的升级/经营动作。
- Action available: 就地按钮；铁匠打造压缩为部位选择。
- Feedback after action: 结果弹窗和节点状态同时更新。
- Recovery if wrong: 行动执行前可关闭浮层；执行后属于有意的不可撤销经营选择。

### 3. 手动配装

- User expects: 先选角色，再比较物品，知道替换/出售限制。
- UI must show: 全角色列表、定位、偏好词条、八部位、背包详情相邻。
- Action available: 装备、卸下、出售；不提供一键配装。
- Feedback after action: 对应部位即时变化，toast 近场反馈。
- Recovery if wrong: 可卸下或用另一件替换；跨角色转交会明确提示先由原使用者卸下。

### 4. 突袭与决战

- User expects: 知道投入多少粮、双方是谁、能否取消。
- UI must show: 三档补给、预计发挥、双方名单；不显示胜率。
- Action available: 取消或进入战斗。
- Feedback after action: 完整战斗后显示存活、倒下者、输出与局势变化。
- Recovery if wrong: 战前可以取消；开战后无跳过，失败是有意压力。

## Findings and minimal fixes

- Wrong priority：平铺所有经营动作会在第3日过载。已改为地图节点局部展开；市场出售放进当前物品详情；八个打造按钮压成下拉框。
- No recovery：装备原本只能替换，不能卸下。已在核心与前端补当前角色逐件卸装。
- Ambiguous result：战斗只显示存活人数时，不知道谁倒下。已在战斗结果中列出倒下者。
- Hidden action：决战全员集结与最后晨收原本直到第7日才知道。已常驻战争牌的折叠规则，并在程序观察中公开。
- State mismatch：隐藏底栏后战斗仍会留下空白行。已让战斗状态回收整块屏幕给正式战场。
- Disabled reason：已装备物品或集市购买力不足时，详情区说明为何不能出售；跨角色转交说明恢复步骤。

## Remaining risk

- 按用户要求没有启动服务器或浏览器，因此本轮只完成静态与程序验证，没有真实浏览器像素级检查。
- 页面面向桌面快速试玩，最小宽度1080px；没有为手机布局做额外压缩。
- 背包上限200件，网格可滚动但未做虚拟列表；简单DOM卡片在200件规模应可用，仍需真人浏览器体验确认。

## Do not change

- 不增加一键配装。
- 不显示胜率、内部倍率、掉率表或推荐答案。
- 不提供战斗跳过或直接结算。
- 不把地图重新拆成“地点列表/描述/行动”三个并列栏。
