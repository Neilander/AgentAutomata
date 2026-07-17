const SCHEMA = "player_battle_information_v2";

const PERCEPTION_LEVELS = Object.freeze({
  low: Object.freeze({ label: "窄幅感知", sensitivityBias: -1.05 }),
  ordinary: Object.freeze({ label: "普通感知", sensitivityBias: 0 }),
  high: Object.freeze({ label: "宽幅感知", sensitivityBias: 1.05 }),
});

const DEFAULT_SEED = "battle-perception";
const RECEPTION_CENTER = 0.84;
const RECEPTION_TEMPERATURE = 0.16;
const SINGLE_EVENT_REPETITION = 1 - Math.exp(-1 / 2.8);

const SUPPORTED_TYPES = new Set([
  "field",
  "damage",
  "heal",
  "shield",
  "shieldBreak",
  "status",
  "skill",
  "death",
  "combat_result",
  "loot_outcome",
  "loot",
  "equipment_change",
  "map_unlock",
  "character_unlock",
]);

const NEVER_PLAYER_TYPES = new Set([
  "action_summary",
  "team_experiment_result",
]);

const RANGED_OBSERVATION = /(箭|射击|投射|飞弹|弹丸|弩|标枪|火球|冰矛|闪电链)/;
const MELEE_OBSERVATION = /(重击|顺劈|斩|劈|猛击|突刺|拳|爪|撕咬|冲撞)/;

function parseBattleInformation(rawEventsInput, options = {}) {
  const perceptionLevel = normalizePerceptionLevel(options.perceptionLevel);
  const config = PERCEPTION_LEVELS[perceptionLevel];
  const seed = String(options.seed || DEFAULT_SEED);
  const candidates = buildCandidates(rawEventsInput)
    .map((candidateRow) => scoreCandidate(candidateRow, options));
  const selected = candidates.filter((candidateRow) => (
    candidateRow.forced
    || candidateRow.sharedDetectionValue <= candidateReceptionProbability(
      candidateRow,
      perceptionLevel,
    )
  ));

  return {
    schema: SCHEMA,
    perception: {
      level: perceptionLevel,
      label: config.label,
      model: "independent_signal_threshold",
    },
    signals: selected.map((candidate) => ({
      id: candidate.publicId,
      type: candidate.type,
      importance: candidate.importance,
      statement: candidate.statement,
    })),
  };

  function scoreCandidate(candidateRow, parseOptions) {
    const features = candidateFeatures(candidateRow, parseOptions);
    const strength = clamp(
      features.salience * 0.32
      + features.clarity * 0.18
      + features.magnitude * 0.18
      + features.goalRelevance * 0.14
      + features.attentionAvailability * 0.18,
      0,
      1,
    );
    return {
      ...candidateRow,
      features,
      strength: round(strength),
      sharedDetectionValue: deterministicUnitInterval(
        `${seed}|${candidateRow.detectionKey}`,
      ),
    };
  }
}

function parseAllPerceptionLevels(rawEventsInput, options = {}) {
  return Object.fromEntries(
    Object.keys(PERCEPTION_LEVELS).map((level) => [
      level,
      parseBattleInformation(rawEventsInput, { ...options, perceptionLevel: level }),
    ]),
  );
}

function inspectBattleInformation(rawEventsInput, options = {}) {
  const rawEvents = clone(rawEventsInput || []);
  const visibleEvents = rawEvents.filter(isPlayerVisible);
  const candidates = buildCandidates(rawEvents);
  const parsedByLevel = parseAllPerceptionLevels(rawEvents, options);
  const scoredCandidates = candidates.map((candidateRow) => inspectCandidate(candidateRow, options));
  const sourceEnemyTokens = collectEnemyIdentityTokens(rawEvents);
  const forbiddenOutputTerms = [
    "diagnosis",
    "emotionDelta",
    "\"H\"",
    "\"role\"",
    "knight",
    "priest",
    "ranger",
    "后排治疗",
  ];
  const outputText = JSON.stringify(parsedByLevel);
  const leakedEnemyTokens = [...sourceEnemyTokens].filter((token) => (
    token.length >= 3 && outputText.includes(token)
  ));
  const leakedForbiddenTerms = forbiddenOutputTerms.filter((term) => outputText.includes(term));
  const coverage = coverageAudit(visibleEvents, candidates);
  const nesting = nestingAudit(parsedByLevel);

  return {
    schema: "player_battle_information_audit_v2",
    source: {
      rawEventCount: rawEvents.length,
      visibleEventCount: visibleEvents.length,
      supportedVisibleEventCount: visibleEvents.filter((event) => SUPPORTED_TYPES.has(event.type)).length,
      ignoredInternalEventCount: visibleEvents.filter((event) => NEVER_PLAYER_TYPES.has(event.type)).length,
      ignoredUnknownEventTypes: [...new Set(
        visibleEvents
          .filter((event) => !SUPPORTED_TYPES.has(event.type) && !NEVER_PLAYER_TYPES.has(event.type))
          .map((event) => event.type),
      )],
    },
    candidateSignalCount: candidates.length,
    candidateSignalTypes: candidates.map((row) => row.type),
    candidateDiagnostics: scoredCandidates,
    coverage,
    excessInformation: {
      leakedEnemyTokens,
      leakedForbiddenTerms,
      hasRawEventIds: /(?:combat|event|attempt):\d+/.test(outputText),
      pass: leakedEnemyTokens.length === 0
        && leakedForbiddenTerms.length === 0
        && !/(?:combat|event|attempt):\d+/.test(outputText),
    },
    perceptionScale: {
      nesting,
      forcedQuota: false,
      episodeRates: Object.fromEntries(
        Object.entries(parsedByLevel).map(([level, result]) => [
          level,
          candidates.length ? round(result.signals.length / candidates.length) : 0,
        ]),
      ),
      pass: nesting.pass,
    },
    pass: coverage.every((row) => row.pass)
      && leakedEnemyTokens.length === 0
      && leakedForbiddenTerms.length === 0
      && !/(?:combat|event|attempt):\d+/.test(outputText)
      && nesting.pass,
    parsedByLevel,
  };

  function inspectCandidate(candidateRow, parseOptions) {
    const features = candidateFeatures(candidateRow, parseOptions);
    const strength = clamp(
      features.salience * 0.32
      + features.clarity * 0.18
      + features.magnitude * 0.18
      + features.goalRelevance * 0.14
      + features.attentionAvailability * 0.18,
      0,
      1,
    );
    const draw = deterministicUnitInterval(
      `${String(parseOptions.seed || DEFAULT_SEED)}|${candidateRow.detectionKey}`,
    );
    return {
      type: candidateRow.type,
      statement: candidateRow.statement,
      forced: candidateRow.forced,
      anchor: candidateRow.forced || Boolean(candidateRow.minimumReception),
      evidenceCount: candidateRow.evidence.length,
      features,
      strength: round(strength),
      sharedDetectionValue: draw,
      receptionProbability: Object.fromEntries(
        Object.entries(PERCEPTION_LEVELS).map(([level, profile]) => [
          level,
          round(Math.max(
            receptionProbability(
              strength,
              profile,
              features.effectiveOpportunities,
            ),
            Number(candidateRow.minimumReception?.[level] || 0),
          )),
        ]),
      ),
    };
  }
}

function buildCandidates(rawEventsInput) {
  const events = annotateAttentionAvailability(clone(rawEventsInput || []))
    .filter(isPlayerVisible)
    .filter((event) => SUPPORTED_TYPES.has(event.type));
  const candidates = [
    ...buildOutcomeSignals(events),
    ...buildFieldSignals(events),
    ...buildDeathSignals(events),
    ...buildDamageSignals(events),
    ...buildSupportSignals(events),
    ...buildStatusSignals(events),
    ...buildSkillSignals(events),
    ...buildRewardSignals(events),
  ];
  return candidates
    .filter((row) => row && row.statement)
    .sort((a, b) => b.priority - a.priority || a.order - b.order)
    .map((row) => ({ ...row, detectionKey: stableDetectionKey(row) }))
    .map(assignOpaquePublicId());
}

function buildOutcomeSignals(events) {
  const event = [...events].reverse().find((row) => row.type === "combat_result");
  if (!event) return [];
  const result = event.result || {};
  const won = ["combat_win", "win", "victory"].includes(result.kind)
    || result.outcome === "win"
    || result.won === true;
  const lost = ["combat_loss", "loss", "defeat"].includes(result.kind)
    || result.outcome === "loss"
    || result.won === false;
  const outcome = won ? "胜利" : lost ? "失败" : "战斗已经结束";
  const survivors = result.survivors || {};
  const allySurvivors = finiteNumber(survivors.ally ?? survivors.player);
  const suffix = allySurvivors == null
    ? ""
    : allySurvivors === 0 ? "，我方无人存活" : `，我方仍有${allySurvivors}人存活`;
  return [candidate(
    "combat_outcome",
    100,
    0,
    "关键",
    `本场战斗${outcome}${suffix}。`,
    [event],
    { magnitude: 1, forced: true },
  )];
}

function buildFieldSignals(events) {
  const rows = events.filter((event) => event.type === "field");
  if (!rows.length) return [];
  const names = unique(rows.map(visibleBehaviorName).filter(Boolean)).slice(0, 2);
  const detail = names.length ? `：${names.join("、")}` : "";
  return [candidate(
    "visible_field_effect",
    94,
    firstOrder(rows),
    "关键",
    `本场出现了界面可见的战场效果${detail}。`,
    rows,
    { magnitude: 0.9 },
  )];
}

function buildDeathSignals(events) {
  const rows = events.filter((event) => event.type === "death");
  const allyRows = rows.filter((event) => event.result?.target?.side === "left" || event.result?.kind === "ally_death");
  const enemyRows = rows.filter((event) => event.result?.target?.side === "right" || event.result?.kind === "enemy_kill");
  const signals = [];
  if (allyRows.length) {
    const names = unique(allyRows.map((event) => visibleFriendlyName(event.result?.target)).filter(Boolean));
    const who = names.length ? names.join("、") : `${allyRows.length}名我方角色`;
    signals.push(candidate(
      "ally_defeated",
      92,
      firstOrder(allyRows),
      "关键",
      `${who}在本场战斗中倒下。`,
      allyRows,
      {
        magnitude: 1,
        minimumReception: { low: 0.95, ordinary: 0.98, high: 0.995 },
      },
    ));
  }
  if (enemyRows.length) {
    signals.push(candidate(
      "enemy_defeated",
      52,
      firstOrder(enemyRows),
      "一般",
      `我方在本场击倒了${enemyRows.length}个敌方单位。`,
      enemyRows,
      { magnitude: clamp(enemyRows.length / 3, 0.45, 1) },
    ));
  }
  return signals;
}

function buildDamageSignals(events) {
  const rows = events.filter((event) => event.type === "damage");
  const incoming = rows.filter((event) => event.subject?.side === "right");
  const outgoing = rows.filter((event) => event.subject?.side === "left");
  const signals = [];

  const incomingGroups = groupBy(incoming, observedAttackMode);
  const totalIncoming = sumVisibleAmounts(incoming);
  for (const [mode, group] of incomingGroups) {
    const targets = mostFrequentNames(group.map((event) => visibleFriendlyName(event.result?.target)).filter(Boolean));
    const targetText = targets.length ? `，主要打向${targets.join("、")}` : "";
    const shareText = relativeShareText(sumVisibleAmounts(group), totalIncoming);
    signals.push(candidate(
      `incoming_damage_${mode}`,
      86 + Math.min(3, group.length / 10),
      firstOrder(group),
      "关键",
      `${enemyAttackSubject(mode)}本场${frequencyText(group.length)}对我方造成伤害${shareText}${targetText}。`,
      group,
      { magnitude: shareValue(sumVisibleAmounts(group), totalIncoming) },
    ));
  }

  const outgoingGroups = groupBy(outgoing, (event) => visibleFriendlyName(event.subject) || "我方角色");
  const totalOutgoing = sumVisibleAmounts(outgoing);
  for (const [name, group] of outgoingGroups) {
    const shareText = relativeShareText(sumVisibleAmounts(group), totalOutgoing);
    signals.push(candidate(
      "ally_damage_contribution",
      78 + Math.min(8, shareValue(sumVisibleAmounts(group), totalOutgoing) * 8),
      firstOrder(group),
      "重要",
      `${name}本场${frequencyText(group.length)}造成伤害${shareText}。`,
      group,
      { magnitude: shareValue(sumVisibleAmounts(group), totalOutgoing) },
    ));
  }
  return signals;
}

function buildSupportSignals(events) {
  const signals = [];
  for (const [type, action, priority] of [
    ["heal", "治疗", 82],
    ["shield", "施加护盾", 80],
    ["shieldBreak", "打破护盾", 78],
  ]) {
    const rows = events.filter((event) => event.type === type);
    const groups = groupBy(rows, (event) => (
      event.subject?.side === "right"
        ? `enemy:${type}`
        : `ally:${visibleFriendlyName(event.subject) || "我方角色"}`
    ));
    for (const [key, group] of groups) {
      const enemy = key.startsWith("enemy:");
      const subject = enemy
        ? type === "heal"
          ? "使用过治疗的敌方单位"
          : type === "shield"
            ? "使用过护盾的敌方单位"
            : "打破过护盾的敌方单位"
        : key.slice("ally:".length);
      const enemyAction = enemy && type === "heal"
        ? "进行了治疗"
        : enemy && type === "shield"
          ? "提供了护盾"
          : action;
      signals.push(candidate(
        `${enemy ? "enemy" : "ally"}_${type}`,
        priority + (enemy ? 2 : 0),
        firstOrder(group),
        enemy ? "重要" : "一般",
        `${subject}本场${frequencyText(group.length)}${enemyAction}。`,
        group,
        { magnitude: supportMagnitude(group, events) },
      ));
    }
  }
  return signals;
}

function buildStatusSignals(events) {
  const rows = events.filter((event) => event.type === "status");
  const groups = groupBy(rows, (event) => event.subject?.side === "right" ? "enemy" : "ally");
  const signals = [];
  for (const [side, group] of groups) {
    const names = unique(group.map(visibleBehaviorName).filter(Boolean)).slice(0, 4);
    const effectText = names.length ? names.map((name) => `“${name}”`).join("、") : "可见状态";
    const subject = side === "enemy"
      ? "敌方单位"
      : "我方角色";
    signals.push(candidate(
      `${side}_visible_status`,
      side === "enemy" ? 76 : 64,
      firstOrder(group),
      "重要",
      `${subject}本场施加过界面显示的${effectText}等效果。`,
      group,
      { magnitude: clamp(unique(group.map(visibleBehaviorName).filter(Boolean)).length / 4, 0.3, 1) },
    ));
  }
  return signals;
}

function buildSkillSignals(events) {
  const effectNames = new Set(events
    .filter((event) => ["damage", "heal", "shield", "shieldBreak", "status"].includes(event.type))
    .map(visibleBehaviorName)
    .filter(Boolean));
  const rows = events.filter((event) => event.type === "skill" && !effectNames.has(visibleBehaviorName(event)));
  const groups = groupBy(rows, (event) => event.subject?.side === "right" ? "enemy" : "ally");
  const signals = [];
  for (const [side, group] of groups) {
    const names = unique(group.map(visibleBehaviorName).filter(Boolean)).slice(0, 4);
    const skillText = names.length ? names.map((name) => `“${name}”`).join("、") : "技能";
    const subject = side === "enemy"
      ? "敌方单位"
      : "我方角色";
    signals.push(candidate(
      `${side}_visible_skill`,
      side === "enemy" ? 62 : 56,
      firstOrder(group),
      "一般",
      `${subject}本场还使用过${skillText}等可见技能。`,
      group,
      { magnitude: clamp(unique(group.map(visibleBehaviorName).filter(Boolean)).length / 4, 0.2, 0.8) },
    ));
  }
  return signals;
}

function buildRewardSignals(events) {
  const signals = [];
  const lootRows = events.filter((event) => event.type === "loot");
  for (const event of lootRows.slice(0, 3)) {
    const itemName = visibleText(event.result?.itemName || event.result?.name || event.result?.item?.name);
    const rarity = localizeRarity(visibleText(event.result?.rarity || event.result?.item?.rarity));
    const item = itemName || "一件战利品";
    const rarityText = rarity && !item.includes(rarity) ? `（${rarity}）` : "";
    signals.push(candidate(
      "visible_loot",
      74,
      eventOrder(event),
      "重要",
      `战后获得了${item}${rarityText}。`,
      [event],
      {
        magnitude: rarityMagnitude(rarity),
        forced: event.presentation?.blocking === true,
        minimumReception: lootReceptionFloor(rarity),
      },
    ));
  }

  const unlockRows = events.filter((event) => event.type === "map_unlock");
  if (unlockRows.length) {
    signals.push(candidate(
      "visible_map_unlock",
      68,
      firstOrder(unlockRows),
      "一般",
      "战后界面显示有新的地图入口开放。",
      unlockRows,
      { magnitude: 0.7, forced: unlockRows.some((event) => event.presentation?.blocking === true) },
    ));
  }

  const characterRows = events.filter((event) => event.type === "character_unlock");
  for (const event of characterRows) {
    const name = visibleText(event.result?.characterName || event.result?.name);
    signals.push(candidate(
      "visible_character_unlock",
      70,
      eventOrder(event),
      "重要",
      name ? `战后解锁了角色${name}。` : "战后解锁了一名新角色。",
      [event],
      { magnitude: 1, forced: true },
    ));
  }
  return signals;
}

function coverageAudit(visibleEvents, candidates) {
  const checks = [
    ["combat_result", ["combat_outcome"]],
    ["field", ["visible_field_effect"]],
    ["death", ["ally_defeated", "enemy_defeated"]],
    ["damage", ["incoming_damage_", "ally_damage_contribution"]],
    ["heal", ["enemy_heal", "ally_heal"]],
    ["shield", ["enemy_shield", "ally_shield"]],
    ["shieldBreak", ["enemy_shieldBreak", "ally_shieldBreak"]],
    ["status", ["enemy_visible_status", "ally_visible_status"]],
    ["skill", ["enemy_visible_skill", "ally_visible_skill"]],
    ["loot", ["visible_loot"]],
    ["map_unlock", ["visible_map_unlock"]],
    ["character_unlock", ["visible_character_unlock"]],
  ];
  return checks
    .filter(([sourceType]) => visibleEvents.some((event) => event.type === sourceType))
    .map(([sourceType, acceptedPrefixes]) => {
      const pass = candidates.some((candidateRow) => (
        acceptedPrefixes.some((prefix) => candidateRow.type.startsWith(prefix))
      )) || (
        sourceType === "skill"
        && visibleEvents.some((skillEvent) => (
          candidates.some((candidateRow) => (
            ["damage", "heal", "shield", "shieldBreak", "status"].some((type) => (
              candidateRow.type.includes(type)
              && visibleBehaviorName(skillEvent)
              && visibleEvents.some((effectEvent) => (
                effectEvent.type === type && visibleBehaviorName(effectEvent) === visibleBehaviorName(skillEvent)
              ))
            ))
          ))
        ))
      );
      return { sourceType, pass };
    });
}

function nestingAudit(parsedByLevel) {
  const low = new Set(parsedByLevel.low.signals.map((row) => `${row.type}|${row.statement}`));
  const ordinary = new Set(parsedByLevel.ordinary.signals.map((row) => `${row.type}|${row.statement}`));
  const high = new Set(parsedByLevel.high.signals.map((row) => `${row.type}|${row.statement}`));
  const lowInsideOrdinary = [...low].every((row) => ordinary.has(row));
  const ordinaryInsideHigh = [...ordinary].every((row) => high.has(row));
  return {
    lowInsideOrdinary,
    ordinaryInsideHigh,
    pass: lowInsideOrdinary && ordinaryInsideHigh,
  };
}

function candidate(type, priority, order, importance, statement, evidence = [], options = {}) {
  return {
    type,
    priority,
    order,
    importance,
    statement,
    evidence,
    magnitude: Number.isFinite(Number(options.magnitude))
      ? clamp(Number(options.magnitude), 0, 1)
      : null,
    forced: options.forced === true || evidence.some((event) => event.presentation?.blocking === true),
    minimumReception: options.minimumReception || null,
  };
}

function stableDetectionKey(candidateRow) {
  const stableStatement = String(candidateRow.statement || "")
    .replace(/本场(?:曾经|几次|多次)/g, "本场")
    .replace(/\d+(?:\.\d+)?/g, "#");
  return `${candidateRow.type}|${stableStatement}`;
}

function assignOpaquePublicId() {
  const seen = new Map();
  return (candidateRow) => {
    const occurrence = (seen.get(candidateRow.detectionKey) || 0) + 1;
    seen.set(candidateRow.detectionKey, occurrence);
    return {
      ...candidateRow,
      publicId: `battle_signal:${hash32(`${candidateRow.detectionKey}|${occurrence}`)
        .toString(16)
        .padStart(8, "0")}`,
    };
  };
}

function candidateFeatures(candidateRow, options = {}) {
  const evidence = candidateRow.evidence || [];
  const repetition = 1 - Math.exp(-evidence.length / 2.8);
  return {
    salience: round(clamp((Number(candidateRow.priority || 45) - 40) / 60, 0.15, 1)),
    clarity: round(average(evidence.map(eventClarity), 0.5)),
    magnitude: round(candidateRow.magnitude == null ? 0.45 : candidateRow.magnitude),
    repetition: round(repetition),
    effectiveOpportunities: round(
      1 + 4 * clamp(
        (repetition - SINGLE_EVENT_REPETITION) / (1 - SINGLE_EVENT_REPETITION),
        0,
        1,
      ),
    ),
    goalRelevance: round(goalRelevance(candidateRow, options.goalFocus)),
    attentionAvailability: round(average(
      evidence.map((event) => Number(event._attentionAvailability ?? event.presentation?.attentionShare ?? 1)),
      1,
    )),
  };
}

function goalRelevance(candidateRow, goalFocusInput) {
  const focus = Array.isArray(goalFocusInput)
    ? goalFocusInput.map((value) => String(value).toLowerCase())
    : goalFocusInput ? [String(goalFocusInput).toLowerCase()] : [];
  if (!focus.length) return 0.55;
  const tags = signalGoalTags(candidateRow.type);
  const matched = focus.some((goal) => (
    candidateRow.type.toLowerCase().includes(goal)
    || tags.some((tag) => tag.includes(goal) || goal.includes(tag))
  ));
  return matched ? 1 : 0.35;
}

function signalGoalTags(type) {
  if (["ally_defeated", "incoming_damage_", "enemy_heal", "enemy_shield"].some((prefix) => type.startsWith(prefix))) {
    return ["survival", "failure_cause", "enemy_threat"];
  }
  if (["ally_damage_contribution", "ally_heal", "ally_shield"].some((prefix) => type.startsWith(prefix))) {
    return ["character_strength", "roster", "team_contribution"];
  }
  if (type === "visible_loot") return ["loot", "equipment", "growth"];
  if (type.includes("unlock")) return ["progress", "discovery"];
  if (type === "visible_field_effect" || type.includes("status")) return ["mechanic", "failure_cause"];
  return ["combat"];
}

function eventClarity(event) {
  const presentation = event.presentation || {};
  const channels = [
    presentation.hasSource === true,
    presentation.hasTarget === true,
    presentation.hasNumber === true
      || presentation.hasHealthDelta === true
      || presentation.hasAnimation === true,
  ];
  const channelClarity = 0.35 + channels.filter(Boolean).length / channels.length * 0.65;
  const render = presentation.renderEvidence;
  if (!render) return channelClarity;
  const size = clamp(Number(render.fontPx || 0) / 16, 0.3, 1);
  const motion = render.moving
    ? clamp(Number(render.animationSeconds || 0) / 0.9, 0.45, 1)
    : 0.35;
  const color = ({
    default: 0.68,
    fire: 0.9,
    poison: 0.82,
    heal: 0.8,
    shield: 0.82,
    purple: 0.9,
  })[render.colorToken] || 0.68;
  const visualStrength = (size + motion + color) / 3;
  return clamp(channelClarity * (0.55 + 0.45 * visualStrength), 0, 1);
}

function annotateAttentionAvailability(events) {
  const rows = events || [];
  const visible = rows.filter(isPlayerVisible);
  for (const event of visible) {
    if (Number.isFinite(Number(event.presentation?.attentionShare))) {
      event._attentionAvailability = clamp(Number(event.presentation.attentionShare), 0.12, 1);
      continue;
    }
    const zone = event.presentation?.attentionZone || "global";
    const start = Number(event.time || 0);
    const duration = Math.max(
      0.05,
      Number(event.presentation?.renderEvidence?.animationSeconds || 0.4),
    );
    const end = start + duration;
    const competitorCount = visible.filter((other) => {
      const otherZone = other.presentation?.attentionZone || "global";
      if (otherZone !== zone) return false;
      const otherStart = Number(other.time || 0);
      const otherDuration = Math.max(
        0.05,
        Number(other.presentation?.renderEvidence?.animationSeconds || 0.4),
      );
      return otherStart < end && start < otherStart + otherDuration;
    }).length;
    event._attentionAvailability = 1 / Math.pow(Math.max(1, competitorCount), 0.55);
  }
  return rows;
}

function receptionProbability(strength, profile, effectiveOpportunities = 1) {
  const z = (Number(strength || 0) - RECEPTION_CENTER) / RECEPTION_TEMPERATURE
    + Number(profile.sensitivityBias || 0);
  const singleOpportunity = 1 / (1 + Math.exp(-z));
  return 1 - Math.pow(
    1 - singleOpportunity,
    clamp(effectiveOpportunities, 1, 5),
  );
}

function candidateReceptionProbability(candidateRow, level) {
  return Math.max(
    receptionProbability(
      candidateRow.strength,
      PERCEPTION_LEVELS[level],
      candidateRow.features.effectiveOpportunities,
    ),
    Number(candidateRow.minimumReception?.[level] || 0),
  );
}

function deterministicUnitInterval(text) {
  return round(hash32(text) / 4294967296, 8);
}

function hash32(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rarityMagnitude(rarity) {
  return ({
    普通: 0.3,
    优秀: 0.42,
    稀有: 0.58,
    史诗: 0.75,
    传说: 0.9,
    神话: 1,
  })[rarity] || 0.4;
}

function lootReceptionFloor(rarity) {
  if (rarity === "神话") return { low: 0.95, ordinary: 0.99, high: 0.999 };
  if (rarity === "传说") return { low: 0.75, ordinary: 0.92, high: 0.985 };
  if (rarity === "史诗") return { low: 0.45, ordinary: 0.75, high: 0.93 };
  return null;
}

function isPlayerVisible(event) {
  return event && event.presentation?.visible !== false;
}

function observedAttackMode(event) {
  const visible = [
    event.behavior?.name,
    ...(event.presentation?.visibleTags || []),
  ].filter(Boolean).join(" ");
  if (RANGED_OBSERVATION.test(visible)) return "ranged";
  if (MELEE_OBSERVATION.test(visible)) return "melee";
  return "unspecified";
}

function enemyAttackSubject(mode) {
  if (mode === "ranged") return "表现出远程攻击的敌方单位";
  if (mode === "melee") return "表现出近身攻击的敌方单位";
  return "攻击方式不明显的敌方单位";
}

function localizeRarity(value) {
  return ({
    common: "普通",
    uncommon: "优秀",
    rare: "稀有",
    epic: "史诗",
    legendary: "传说",
    mythic: "神话",
  })[String(value || "").toLowerCase()] || value;
}

function visibleBehaviorName(event) {
  return visibleText(event?.behavior?.name);
}

function visibleFriendlyName(ref) {
  if (!ref || ref.side === "right") return null;
  return visibleText(ref.name);
}

function visibleText(value) {
  const text = String(value || "").trim();
  if (!text || looksInternal(text)) return null;
  return text;
}

function looksInternal(text) {
  return /^(?:hero|enemy|unit|concept|right|left|r[12]_|knowledge|event|candidate)[_:|-]/i.test(text)
    || /^(?:knight|priest|ranger|mage|warrior|tank|healer)$/i.test(text);
}

function collectEnemyIdentityTokens(events) {
  const tokens = new Set();
  for (const event of events) {
    for (const ref of [event.subject, event.result?.target]) {
      if (ref?.side !== "right") continue;
      if (ref.id) tokens.add(String(ref.id));
      if (ref.name) tokens.add(String(ref.name));
      if (ref.role) tokens.add(String(ref.role));
    }
  }
  return tokens;
}

function frequencyText(count) {
  if (count >= 5) return "多次";
  if (count >= 2) return "几次";
  return "曾经";
}

function relativeShareText(value, total) {
  if (!(value > 0) || !(total > 0)) return "";
  const share = value / total;
  if (share >= 0.65) return "，占可见总量的大部分";
  if (share >= 0.35) return "，占可见总量的较大一部分";
  return "，占可见总量的一小部分";
}

function shareValue(value, total) {
  return total > 0 ? value / total : 0;
}

function sumVisibleAmounts(events) {
  return events.reduce((sum, event) => {
    if (event.presentation?.hasNumber === false) return sum;
    return sum + Math.max(0, Number(event.result?.amount || 0));
  }, 0);
}

function supportMagnitude(group, allEvents) {
  const explicitRatios = group
    .map((event) => finiteNumber(
      event.result?.healthRatioDelta
      ?? event.result?.maxHealthRatio
      ?? event.result?.magnitudeRatio,
    ))
    .filter((value) => value != null)
    .map((value) => clamp(Math.abs(value), 0, 1));
  if (explicitRatios.length) return average(explicitRatios, 0.35);

  const supportAmounts = group
    .filter((event) => event.presentation?.hasNumber !== false)
    .map((event) => Math.max(0, Number(event.result?.amount || 0)))
    .filter((value) => value > 0);
  const damageAmounts = allEvents
    .filter((event) => event.type === "damage" && event.presentation?.hasNumber !== false)
    .map((event) => Math.max(0, Number(event.result?.amount || 0)))
    .filter((value) => value > 0)
    .sort((a, b) => a - b);
  if (!supportAmounts.length || !damageAmounts.length) return 0.35;

  const averageSupport = average(supportAmounts, 0);
  const middle = Math.floor(damageAmounts.length / 2);
  const typicalDamage = damageAmounts.length % 2
    ? damageAmounts[middle]
    : (damageAmounts[middle - 1] + damageAmounts[middle]) / 2;
  return clamp(averageSupport / Math.max(1, averageSupport + typicalDamage), 0.15, 0.9);
}

function mostFrequentNames(names) {
  const counts = new Map();
  for (const name of names) counts.set(name, (counts.get(name) || 0) + 1);
  if (!counts.size) return [];
  const max = Math.max(...counts.values());
  return [...counts.entries()]
    .filter(([, count]) => count === max)
    .map(([name]) => name)
    .slice(0, 2);
}

function groupBy(rows, keyOf) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

function firstOrder(rows) {
  return Math.min(...rows.map(eventOrder));
}

function eventOrder(event) {
  return Number.isFinite(Number(event?.time)) ? Number(event.time) : 0;
}

function finiteNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function unique(rows) {
  return [...new Set(rows)];
}

function normalizePerceptionLevel(level) {
  return PERCEPTION_LEVELS[level] ? level : "ordinary";
}

function average(values, fallback = 0) {
  const finite = values.filter((value) => Number.isFinite(Number(value)));
  return finite.length
    ? finite.reduce((sum, value) => sum + Number(value), 0) / finite.length
    : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

function clone(value) {
  return structuredClone(value);
}

module.exports = {
  SCHEMA,
  PERCEPTION_LEVELS,
  parseBattleInformation,
  parseAllPerceptionLevels,
  inspectBattleInformation,
};
