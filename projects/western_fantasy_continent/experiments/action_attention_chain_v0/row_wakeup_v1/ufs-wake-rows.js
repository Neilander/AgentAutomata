"use strict";

module.exports = [
  {
    rowId: "W001", sourceRuleId: "R03", triggerDescription: "飞船只是经过带图标的路径格，并未最终停留。",
    requires: [{ factPath: "subject.type", equals: "ship" }, { factPath: "transition", equals: "passed_cell" }],
    emit: [], chainDirective: "stop",
  },
  {
    rowId: "W002", sourceRuleId: "R05", triggerDescription: "飞船最终停在向右箭头格。",
    requires: [{ factPath: "subject.type", equals: "ship" }, { factPath: "transition", equals: "final_landing" }, { factPath: "observed.tags", includes: "arrow_right" }],
    emit: [{ type: "move_ship_horizontal", shipId: "$fact.subject.id", direction: "right", target: "$fact.observed.arrowTarget" }],
  },
  {
    rowId: "W003", sourceRuleId: "R04", triggerDescription: "飞船最终停在母舰下降格。",
    requires: [{ factPath: "subject.type", equals: "ship" }, { factPath: "transition", equals: "final_landing" }, { factPath: "observed.tags", includes: "mothership_down" }],
    emit: [{ type: "lower_mothership", amount: 1 }],
  },
  {
    rowId: "W004", sourceRuleId: "R04", triggerDescription: "母舰移动后最终抵达骷髅行。",
    requires: [{ factPath: "subject.type", equals: "mothership" }, { factPath: "transition", equals: "move_completed" }, { factPath: "observed.tags", includes: "skull" }],
    emit: [{ type: "outcome", result: "loss", reason: "mothership_reached_skull" }], chainDirective: "terminal",
  },
  {
    rowId: "W005", sourceRuleId: "R07", triggerDescription: "飞船最终停在城市命中位置。",
    requires: [{ factPath: "subject.type", equals: "ship" }, { factPath: "transition", equals: "final_landing" }, { factPath: "observed.tags", includes: "city_hit" }],
    emit: [{ type: "damage_city", amount: 1 }, { type: "return_ship_to_waiting", shipId: "$fact.subject.id" }],
  },
  {
    rowId: "W006", sourceRuleId: "R06", triggerDescription: "飞船最终停在爆炸格；骰子放置阶段没有即时效果。",
    requires: [{ factPath: "subject.type", equals: "ship" }, { factPath: "transition", equals: "final_landing" }, { factPath: "observed.tags", includes: "explosion" }],
    emit: [], chainDirective: "stop",
  },
  {
    rowId: "W007", sourceRuleId: "R02", triggerDescription: "防空修正后飞船下降量为0。",
    requires: [{ factPath: "subject.type", equals: "ship_group" }, { factPath: "transition", equals: "descent_computed" }, { factPath: "observed.descent", equals: 0 }],
    emit: [], chainDirective: "stop",
  },
  {
    rowId: "W008", sourceRuleId: "R08", triggerDescription: "白骰引发的确定性飞船链已经结束，尚未放置的骰子需要重投。",
    requires: [{ factPath: "subject.type", equals: "die" }, { factPath: "subject.color", equals: "white" }, { factPath: "transition", equals: "placement_chain_settled" }],
    emit: [{ type: "random_boundary", reason: "reroll_unplaced_dice" }], chainDirective: "random_boundary",
  },
];
