const PLAYER_TEAM = {
  warrior: { id: "hero_warrior", name: "灰鸦战士", role: "warrior", side: "left" },
  mage: { id: "hero_mage", name: "烬火法师", role: "mage", side: "left" },
  ranger: { id: "hero_ranger", name: "苔痕游侠", role: "ranger", side: "left" },
  priest: { id: "hero_priest", name: "晨辉牧师", role: "priest", side: "left" },
  spear: { id: "militia_spear", name: "长枪民兵", role: "militia", side: "left" },
  herb: { id: "militia_herb", name: "草药民兵", role: "militia", side: "left" },
  drum: { id: "militia_drum", name: "战鼓民兵", role: "militia", side: "left" },
};

const PRESET_SPECS = [
  {
    id: "battle_1_weak_swarm",
    label: "弱小怪潮",
    tags: ["swarm", "low_armor"],
    team: ["warrior", "spear", "herb", "drum"],
    values: {
      warrior: { area_damage: 300, single_target_damage: 60 },
      spear: { single_target_damage: 45 },
      herb: { single_target_damage: 20, healing: 40 },
      drum: { single_target_damage: 20, shielding: 20 },
    },
  },
  {
    id: "battle_2_mixed_patrol",
    label: "混合巡逻队",
    tags: ["mixed", "low_armor"],
    team: ["warrior", "mage", "herb", "spear"],
    values: {
      warrior: { area_damage: 80, single_target_damage: 100 },
      mage: { area_damage: 180, single_target_damage: 40 },
      herb: { single_target_damage: 20, healing: 90 },
      spear: { single_target_damage: 70 },
    },
  },
  {
    id: "battle_3_armored_elite",
    label: "重甲精英",
    tags: ["elite", "high_armor"],
    team: ["warrior", "mage", "ranger", "priest"],
    values: {
      warrior: { single_target_damage: 70 },
      mage: { single_target_damage: 300 },
      ranger: { single_target_damage: 200 },
      priest: { single_target_damage: 10, healing: 100 },
    },
  },
  {
    id: "battle_4_armored_elite_repeat",
    label: "重甲精英复战",
    tags: ["elite", "high_armor"],
    team: ["warrior", "mage", "ranger", "priest"],
    values: {
      warrior: { single_target_damage: 60 },
      mage: { single_target_damage: 320 },
      ranger: { single_target_damage: 230 },
      priest: { healing: 120 },
    },
  },
  {
    id: "battle_5_low_armor_champion",
    label: "轻甲冠军",
    tags: ["elite", "low_armor"],
    team: ["warrior", "mage", "ranger", "priest"],
    values: {
      warrior: { area_damage: 80, single_target_damage: 160 },
      mage: { area_damage: 120, single_target_damage: 60 },
      ranger: { single_target_damage: 170 },
      priest: { healing: 100 },
    },
  },
];

function createPresetReports() {
  return PRESET_SPECS.map(buildReport);
}

function buildReport(spec) {
  const playerTeam = spec.team.map((id) => ({ ...PLAYER_TEAM[id] }));
  const eventLog = [];
  const contributions = [];
  let sequence = 1;
  for (const unitId of spec.team) {
    const unit = PLAYER_TEAM[unitId];
    const values = spec.values[unitId] || {};
    const damage = Number(values.area_damage || 0)
      + Number(values.single_target_damage || 0)
      + Number(values.sustained_damage || 0);
    contributions.push({ name: unit.name, role: unit.role, damage });
    for (const [domain, amount] of Object.entries(values)) {
      const events = makeDomainEvents({ spec, unit, domain, amount, startSequence: sequence });
      eventLog.push(...events);
      sequence += events.length;
    }
  }
  return {
    schema: "controlled_battle_report_slice_v1",
    id: spec.id,
    source: "controlled_preset_using_live_semantic_event_shape",
    environment: { id: spec.id, label: spec.label, tags: [...spec.tags] },
    playerTeam,
    gameEvent: {
      node: spec.id,
      outcome: "win",
      duration: 12,
      contributions,
    },
    eventLog,
  };
}

function makeDomainEvents({ spec, unit, domain, amount, startSequence }) {
  const configs = {
    area_damage: { type: "damage", parts: 3, tags: ["skill", "damage", "physical"], targetSide: "right" },
    single_target_damage: { type: "damage", parts: 2, tags: ["damage", "physical"], targetSide: "right" },
    sustained_damage: { type: "damage", parts: 4, tags: ["dot", "damage"], targetSide: "right" },
    healing: { type: "heal", parts: 2, tags: ["skill", "heal"], targetSide: "left" },
    shielding: { type: "shield_absorb", parts: 2, tags: ["skill", "shield"], targetSide: "left" },
    durability: { type: "damage_prevented", parts: 2, tags: ["block"], targetSide: "left" },
    control: { type: "control_prevented_action", parts: 2, tags: ["control"], targetSide: "right" },
  };
  const config = configs[domain];
  if (!config || !(amount > 0)) return [];
  const part = amount / config.parts;
  const castId = `${spec.id}:${unit.id}:${domain}`;
  return Array.from({ length: config.parts }, (_, index) => {
    const hpBefore = config.type === "damage" ? 1000 - index * part : config.type === "heal" ? 500 + index * part : null;
    const hpAfter = config.type === "damage" ? hpBefore - part : config.type === "heal" ? hpBefore + part : null;
    return {
      id: `${spec.id}:event:${startSequence + index}`,
      sequence: startSequence + index,
      time: Number((2 + startSequence * 0.08).toFixed(2)),
      type: config.type,
      subject: { ...unit },
      environment: { node: spec.id, phase: "combat", visibleTags: [...spec.tags] },
      behavior: { kind: "combat_effect", key: domain, name: domain, tags: config.tags },
      result: {
        kind: config.type,
        amount: part,
        target: {
          id: config.targetSide === "right"
            ? `concept:enemy:${domain}:${domain === "area_damage" ? index : 0}`
            : `ally:${index}`,
          name: config.targetSide === "right" ? "敌方单位" : "友方单位",
          side: config.targetSide,
        },
        hpBefore,
        hpAfter,
        occurred: true,
        meta: {
          castId,
          visibleTargetCount: domain === "area_damage" ? config.parts : 1,
        },
      },
      presentation: { visible: true, hasNumber: true, hasSource: true, hasTarget: true, hasHealthDelta: hpBefore !== null },
      signalLayer: "player_semantic",
    };
  });
}

module.exports = { PRESET_SPECS, createPresetReports };
