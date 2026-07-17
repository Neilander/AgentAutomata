const CHARACTERS = {
  warrior: { id: "hero_warrior", name: "Ashbelt Warrior", role: "warrior", side: "left" },
  mage: { id: "hero_mage", name: "Ember Mage", role: "mage", side: "left" },
  ranger: { id: "hero_ranger", name: "Moss Ranger", role: "ranger", side: "left" },
  priest: { id: "hero_priest", name: "Dawn Priest", role: "priest", side: "left" },
  guardian: { id: "hero_guardian", name: "Stone Guardian", role: "guardian", side: "left" },
  duelist: { id: "hero_duelist", name: "Silver Duelist", role: "duelist", side: "left" },
  alchemist: { id: "hero_alchemist", name: "Thorn Alchemist", role: "alchemist", side: "left" },
  militia_a: { id: "militia_a", name: "Militia A", role: "militia", side: "left" },
  militia_b: { id: "militia_b", name: "Militia B", role: "militia", side: "left" },
  militia_c: { id: "militia_c", name: "Militia C", role: "militia", side: "left" },
};

const SYSTEMATIC_SUITES = [
  {
    id: "contextual_correction",
    purpose: "Strong first impression, exact-context correction, repeated counterevidence, and rebound.",
    focalSubjects: ["hero_warrior"],
    reports: [
      spec("cc_weak_swarm", ["swarm", "low_armor"], ["warrior", "militia_a", "militia_b", "militia_c"], {
        warrior: { area_damage: 300, single_target_damage: 60 },
        militia_a: { single_target_damage: 45 },
        militia_b: { single_target_damage: 20, healing: 40 },
        militia_c: { single_target_damage: 20, shielding: 20 },
      }),
      spec("cc_mixed_patrol", ["mixed", "low_armor"], ["warrior", "mage", "priest", "ranger"], {
        warrior: { area_damage: 80, single_target_damage: 100 },
        mage: { area_damage: 180, single_target_damage: 40 },
        priest: { single_target_damage: 20, healing: 90 },
        ranger: { single_target_damage: 70 },
      }),
      spec("cc_armored_elite", ["elite", "high_armor"], ["warrior", "mage", "ranger", "priest"], {
        warrior: { single_target_damage: 70 },
        mage: { single_target_damage: 300 },
        ranger: { single_target_damage: 200 },
        priest: { single_target_damage: 10, healing: 100 },
      }),
      spec("cc_armored_repeat", ["elite", "high_armor"], ["warrior", "mage", "ranger", "priest"], {
        warrior: { single_target_damage: 60 },
        mage: { single_target_damage: 320 },
        ranger: { single_target_damage: 230 },
        priest: { healing: 120 },
      }),
      spec("cc_low_armor_champion", ["elite", "low_armor"], ["warrior", "mage", "ranger", "priest"], {
        warrior: { area_damage: 80, single_target_damage: 160 },
        mage: { area_damage: 120, single_target_damage: 60 },
        ranger: { single_target_damage: 170 },
        priest: { healing: 100 },
      }),
    ],
  },
  {
    id: "profile_trait_resolution",
    purpose: "Near-threshold role signals test the three perception scales without changing objective evidence.",
    focalSubjects: ["hero_mage", "hero_priest", "hero_ranger", "hero_guardian"],
    reports: [
      spec("ptr_mage_65", ["swarm", "low_armor"], ["mage", "warrior", "priest", "ranger"], {
        mage: { area_damage: 130, single_target_damage: 50 },
        warrior: { single_target_damage: 230 },
        priest: { healing: 160, single_target_damage: 30 },
        ranger: { single_target_damage: 200 },
      }),
      spec("ptr_mage_80", ["swarm", "low_armor"], ["mage", "warrior", "priest", "ranger"], {
        mage: { area_damage: 160, single_target_damage: 40 },
        warrior: { single_target_damage: 210 },
        priest: { healing: 150, single_target_damage: 30 },
        ranger: { single_target_damage: 210 },
      }),
      spec("ptr_priest_65", ["boss", "magic_pressure"], ["priest", "warrior", "mage", "ranger"], {
        priest: { healing: 130, single_target_damage: 50 },
        warrior: { single_target_damage: 220 },
        mage: { area_damage: 20, single_target_damage: 180 },
        ranger: { single_target_damage: 200 },
      }),
      spec("ptr_guardian_65", ["elite", "ranged_pressure"], ["guardian", "mage", "priest", "ranger"], {
        guardian: { durability: 130, single_target_damage: 50 },
        mage: { single_target_damage: 220 },
        priest: { healing: 120, single_target_damage: 80 },
        ranger: { single_target_damage: 200 },
      }),
      spec("ptr_ranger_65", ["boss", "high_armor"], ["ranger", "warrior", "mage", "priest"], {
        ranger: { sustained_damage: 130, single_target_damage: 50 },
        warrior: { single_target_damage: 220 },
        mage: { single_target_damage: 200 },
        priest: { healing: 120, single_target_damage: 80 },
      }),
    ],
  },
  {
    id: "roster_replacement_identity",
    purpose: "Late roster entry and analogous replacements must form separate, subject-local impressions.",
    focalSubjects: ["hero_ranger", "hero_duelist"],
    reports: [
      spec("rri_ranger_strong", ["elite", "high_armor"], ["ranger", "warrior", "mage", "priest"], {
        ranger: { single_target_damage: 320 },
        warrior: { single_target_damage: 160 },
        mage: { single_target_damage: 160 },
        priest: { healing: 160 },
      }),
      spec("rri_ranger_weak", ["swarm", "low_armor"], ["ranger", "warrior", "mage", "priest"], {
        ranger: { single_target_damage: 100 },
        warrior: { area_damage: 240 },
        mage: { area_damage: 240 },
        priest: { healing: 220 },
      }),
      spec("rri_duelist_strong", ["elite", "high_armor"], ["duelist", "warrior", "mage", "priest"], {
        duelist: { single_target_damage: 320 },
        warrior: { single_target_damage: 160 },
        mage: { single_target_damage: 160 },
        priest: { healing: 160 },
      }),
      spec("rri_duelist_weak", ["swarm", "low_armor"], ["duelist", "warrior", "mage", "priest"], {
        duelist: { single_target_damage: 100 },
        warrior: { area_damage: 240 },
        mage: { area_damage: 240 },
        priest: { healing: 220 },
      }),
      spec("rri_ranger_neutral", ["mixed", "low_armor"], ["ranger", "warrior", "mage", "priest"], {
        ranger: { single_target_damage: 200 },
        warrior: { single_target_damage: 200 },
        mage: { area_damage: 200 },
        priest: { healing: 200 },
      }),
    ],
  },
  {
    id: "team_relative_confounding",
    purpose: "Hold one character's objective output fixed while changing teammate output.",
    focalSubjects: ["hero_alchemist"],
    reports: [
      confoundSpec("trc_very_weak_team", [50, 50, 50]),
      confoundSpec("trc_weak_team", [100, 100, 100]),
      confoundSpec("trc_equal_team", [200, 200, 200]),
      confoundSpec("trc_strong_team", [300, 300, 300]),
      confoundSpec("trc_mixed_team", [100, 200, 300]),
    ],
  },
];

function spec(id, tags, team, values) {
  return { id, label: id, tags, team, values };
}

function confoundSpec(id, teammateTotals) {
  return spec(id, ["mixed", "low_armor"], ["alchemist", "militia_a", "militia_b", "militia_c"], {
    alchemist: { sustained_damage: 120, single_target_damage: 80 },
    militia_a: { single_target_damage: teammateTotals[0] },
    militia_b: { single_target_damage: teammateTotals[1] },
    militia_c: { single_target_damage: teammateTotals[2] },
  });
}

function createSystematicSuites() {
  return SYSTEMATIC_SUITES.map((suite) => ({
    ...suite,
    reports: suite.reports.map(buildReport),
  }));
}

function buildReport(reportSpec) {
  const playerTeam = reportSpec.team.map((key) => ({ ...CHARACTERS[key] }));
  const eventLog = [];
  const contributions = [];
  let sequence = 1;
  for (const key of reportSpec.team) {
    const unit = CHARACTERS[key];
    const values = reportSpec.values[key] || {};
    const damage = Number(values.area_damage || 0)
      + Number(values.single_target_damage || 0)
      + Number(values.sustained_damage || 0);
    contributions.push({ name: unit.name, role: unit.role, damage });
    for (const [domain, amount] of Object.entries(values)) {
      const events = makeDomainEvents(reportSpec, unit, domain, amount, sequence);
      eventLog.push(...events);
      sequence += events.length;
    }
  }
  return {
    schema: "controlled_battle_report_slice_v1",
    id: reportSpec.id,
    source: "systematic_controlled_preset_using_live_semantic_event_shape",
    environment: { id: reportSpec.id, label: reportSpec.label, tags: [...reportSpec.tags] },
    playerTeam,
    gameEvent: { node: reportSpec.id, outcome: "win", duration: 12, contributions },
    eventLog,
  };
}

function makeDomainEvents(reportSpec, unit, domain, amount, startSequence) {
  const configs = {
    area_damage: { type: "damage", parts: 3, tags: ["skill", "damage"], targetSide: "right" },
    single_target_damage: { type: "damage", parts: 2, tags: ["damage"], targetSide: "right" },
    sustained_damage: { type: "damage", parts: 4, tags: ["dot", "damage"], targetSide: "right" },
    healing: { type: "heal", parts: 2, tags: ["skill", "heal"], targetSide: "left" },
    shielding: { type: "shield_absorb", parts: 2, tags: ["skill", "shield"], targetSide: "left" },
    durability: { type: "damage_prevented", parts: 2, tags: ["block"], targetSide: "left" },
    control: { type: "control_prevented_action", parts: 2, tags: ["control"], targetSide: "right" },
  };
  const config = configs[domain];
  if (!config || !(amount > 0)) return [];
  const part = amount / config.parts;
  const castId = `${reportSpec.id}:${unit.id}:${domain}`;
  return Array.from({ length: config.parts }, (_, index) => {
    const hpBefore = config.type === "damage" ? 1000 - index * part : config.type === "heal" ? 500 + index * part : null;
    const hpAfter = config.type === "damage" ? hpBefore - part : config.type === "heal" ? hpBefore + part : null;
    return {
      id: `${reportSpec.id}:event:${startSequence + index}`,
      sequence: startSequence + index,
      time: Number((2 + startSequence * 0.08).toFixed(2)),
      type: config.type,
      subject: { ...unit },
      environment: { node: reportSpec.id, phase: "combat", visibleTags: [...reportSpec.tags] },
      behavior: { kind: "combat_effect", key: domain, name: domain, tags: config.tags },
      result: {
        kind: config.type,
        amount: part,
        target: {
          id: config.targetSide === "right"
            ? `concept:enemy:${domain}:${domain === "area_damage" ? index : 0}`
            : `ally:${index}`,
          name: config.targetSide === "right" ? "Visible enemy" : "Visible ally",
          side: config.targetSide,
        },
        hpBefore,
        hpAfter,
        occurred: true,
        meta: { castId, visibleTargetCount: domain === "area_damage" ? config.parts : 1 },
      },
      presentation: { visible: true, hasNumber: true, hasSource: true, hasTarget: true, hasHealthDelta: hpBefore !== null },
      signalLayer: "player_semantic",
    };
  });
}

module.exports = { CHARACTERS, SYSTEMATIC_SUITES, createSystematicSuites };
