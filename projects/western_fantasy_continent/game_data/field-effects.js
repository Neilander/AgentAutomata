const GAME_FIELD_EFFECTS = (() => {
  const SKILL_DATA = typeof window !== "undefined"
    ? window.GAME_SKILL_DATA
    : require("./skill-data");

  const ROLE_GROUPS = {
    frontline: ["warrior", "knight", "berserker"],
    basicCarry: ["berserker", "ranger", "assassin", "warrior"],
    caster: ["mage", "warlock", "alchemist", "priest", "bard"],
    dot: ["mage", "warlock", "alchemist"],
    shield: ["knight", "priest", "bard"],
    control: ["ranger", "mage", "bard", "alchemist"],
    backlineHunter: ["assassin", "ranger", "berserker"],
    carryRouting: ["knight", "priest", "bard", "warlock", "ranger", "berserker"],
    areaPressure: ["warrior", "mage", "alchemist", "ranger"],
    statusRecovery: ["priest", "alchemist", "warlock", "knight"],
    duelPressure: ["warrior", "assassin"],
    backlineFocus: ["ranger", "mage", "bard"],
    plagueCraft: ["alchemist", "warlock"],
    bannerFormation: ["warrior", "knight", "bard"],
    sanctumShell: ["knight", "priest", "bard"],
    witchingBurst: ["mage", "warlock", "bard"],
    thornControl: ["ranger", "alchemist", "bard"],
    redAnvil: ["berserker", "warrior", "priest"],
    spellblade: ["warrior", "mage", "assassin"],
    breakerYard: ["warrior", "alchemist", "assassin"],
  };

  const EFFECTS = [
    {
      id: "iron_oath",
      name: "Iron Oath",
      short: "Frontline bodies get harder and push longer fights.",
      family: "survival_frontline",
      targetSignal: "4 frontliners or double-frontline teams should stop collapsing first.",
      favoredRoles: ROLE_GROUPS.frontline,
      levels: [
        { level: 1, expectedLift: 0.2, roles: ROLE_GROUPS.frontline, hpMult: 1.08, armorMult: 1.12, receivedHealingMult: 1.04, teamBonus: { minMatches: 3, hpMult: 1.04, armorMult: 1.05 } },
        { level: 2, expectedLift: 0.4, roles: ROLE_GROUPS.frontline, hpMult: 1.18, armorMult: 1.28, receivedHealingMult: 1.08, teamBonus: { minMatches: 3, hpMult: 1.12, armorMult: 1.14 } },
        { level: 3, expectedLift: 0.7, roles: ROLE_GROUPS.frontline, hpMult: 1.32, armorMult: 1.52, receivedHealingMult: 1.16, teamBonus: { minMatches: 3, hpMult: 1.28, armorMult: 1.32 } },
      ],
      favorableTeams: [
        ["warrior", "knight", "berserker", "warrior"],
        ["knight", "knight", "warrior", "berserker"],
        ["berserker", "berserker", "warrior", "knight"],
        ["warrior", "warrior", "knight", "knight"],
        ["berserker", "knight", "knight", "warrior"],
      ],
      risk: "If all teams benefit, it is just a global stat bump. Watch backline caster teams.",
    },
    {
      id: "arcane_tide",
      name: "Arcane Tide",
      short: "Caster teams turn skill windows into real damage windows.",
      family: "skill_magic",
      targetSignal: "Mage/warlock/alchemist teams should win by skill bursts, not by basic attacks.",
      favoredRoles: ROLE_GROUPS.caster,
      levels: [
        { level: 1, expectedLift: 0.2, roles: ROLE_GROUPS.caster, magicPowerMult: 1.13, skillHasteMult: 1.08 },
        { level: 2, expectedLift: 0.4, roles: ROLE_GROUPS.caster, magicPowerMult: 1.28, skillHasteMult: 1.17 },
        { level: 3, expectedLift: 0.7, roles: ROLE_GROUPS.caster, magicPowerMult: 1.52, skillHasteMult: 1.3 },
      ],
      favorableTeams: [
        ["knight", "mage", "warlock", "priest"],
        ["warrior", "mage", "alchemist", "bard"],
        ["knight", "warlock", "alchemist", "priest"],
        ["berserker", "mage", "mage", "bard"],
        ["warrior", "mage", "warlock", "alchemist"],
      ],
      risk: "Skill haste can become a universal answer if physical carries also rely on skills too much.",
    },
    {
      id: "blood_moon",
      name: "Blood Moon",
      short: "Low-health and brawl carries get paid for staying in danger.",
      family: "low_hp_brawl",
      targetSignal: "Berserker teams should show late fight flips instead of only early stat checks.",
      favoredRoles: ["berserker", "warlock", "assassin"],
      levels: [
        { level: 1, expectedLift: 0.2, roles: ["berserker", "warlock", "assassin"], physicalPowerMult: 1.14, attackSpeedMult: 1.06, effectPowerMult: 1.1, receivedHealingMult: 1.08 },
        { level: 2, expectedLift: 0.4, roles: ["berserker", "warlock", "assassin"], physicalPowerMult: 1.34, attackSpeedMult: 1.13, effectPowerMult: 1.22, receivedHealingMult: 1.18 },
        { level: 3, expectedLift: 0.7, roles: ["berserker", "warlock", "assassin"], physicalPowerMult: 1.72, attackSpeedMult: 1.28, effectPowerMult: 1.42, receivedHealingMult: 1.36 },
      ],
      favorableTeams: [
        ["berserker", "berserker", "warlock", "priest"],
        ["warrior", "berserker", "bard", "priest"],
        ["knight", "berserker", "assassin", "warlock"],
        ["berserker", "warrior", "assassin", "bard"],
        ["berserker", "berserker", "assassin", "warrior"],
      ],
      risk: "May hide berserker weakness by adding too much sustain. Compare no-priest teams.",
    },
    {
      id: "hunter_fog",
      name: "Hunter Fog",
      short: "Backline hunters and mark users get cleaner access.",
      family: "focus_backline",
      targetSignal: "Ranger/assassin teams should punish fragile backlines but not delete every frontline team.",
      favoredRoles: ROLE_GROUPS.backlineHunter,
      levels: [
        { level: 1, expectedLift: 0.2, roles: ROLE_GROUPS.backlineHunter, physicalPowerMult: 1.12, attackSpeedMult: 1.08 },
        { level: 2, expectedLift: 0.4, roles: ROLE_GROUPS.backlineHunter, physicalPowerMult: 1.26, attackSpeedMult: 1.17 },
        { level: 3, expectedLift: 0.7, roles: ROLE_GROUPS.backlineHunter, physicalPowerMult: 1.48, attackSpeedMult: 1.3 },
      ],
      favorableTeams: [
        ["warrior", "assassin", "ranger", "priest"],
        ["knight", "assassin", "assassin", "bard"],
        ["berserker", "ranger", "ranger", "priest"],
        ["warrior", "assassin", "ranger", "bard"],
        ["assassin", "assassin", "ranger", "ranger"],
      ],
      risk: "Single-target burst can become unreadable. Check double-frontline bucket.",
    },
    {
      id: "ember_air",
      name: "Ember Air",
      short: "Damage-over-time teams convert setup into a visible race.",
      family: "dot_pressure",
      targetSignal: "Burn/poison teams should get stronger across longer fights.",
      favoredRoles: ROLE_GROUPS.dot,
      levels: [
        { level: 1, expectedLift: 0.2, roles: ROLE_GROUPS.dot, magicPowerMult: 1.04, effectPowerMult: 1.1 },
        { level: 2, expectedLift: 0.4, roles: ROLE_GROUPS.dot, magicPowerMult: 1.16, effectPowerMult: 1.38 },
        { level: 3, expectedLift: 0.7, roles: ROLE_GROUPS.dot, magicPowerMult: 1.28, effectPowerMult: 1.72 },
      ],
      favorableTeams: [
        ["knight", "mage", "warlock", "alchemist"],
        ["warrior", "mage", "alchemist", "priest"],
        ["knight", "warlock", "warlock", "bard"],
        ["berserker", "mage", "warlock", "priest"],
        ["mage", "warlock", "alchemist", "bard"],
      ],
      risk: "If DOT is too slow, the effect reads weak even when math is correct.",
    },
    {
      id: "shield_echo",
      name: "Shield Echo",
      short: "Protection teams turn shielding into tempo, not only delay.",
      family: "shield_tempo",
      targetSignal: "Knight/priest/bard shells should survive bursts and win by second rotation.",
      favoredRoles: ROLE_GROUPS.shield,
      levels: [
        { level: 1, expectedLift: 0.2, roles: ROLE_GROUPS.shield, hpMult: 1.03, armorMult: 1.06, magicPowerMult: 1.04, receivedHealingMult: 1.07 },
        { level: 2, expectedLift: 0.4, roles: ROLE_GROUPS.shield, hpMult: 1.13, armorMult: 1.22, magicPowerMult: 1.16, receivedHealingMult: 1.26 },
        { level: 3, expectedLift: 0.7, roles: ROLE_GROUPS.shield, hpMult: 1.25, armorMult: 1.42, magicPowerMult: 1.3, receivedHealingMult: 1.5 },
      ],
      favorableTeams: [
        ["knight", "knight", "priest", "bard"],
        ["warrior", "knight", "priest", "priest"],
        ["knight", "mage", "priest", "bard"],
        ["berserker", "knight", "priest", "bard"],
        ["knight", "ranger", "priest", "bard"],
      ],
      risk: "If it only makes fights longer, it teaches nothing. Watch damage contribution.",
    },
    {
      id: "tempo_drum",
      name: "Tempo Drum",
      short: "Basic-attack teams are rewarded for not being skill-window dependent.",
      family: "basic_attack",
      targetSignal: "Fast attackers should gain, pure casters should not receive the same answer.",
      favoredRoles: ["berserker", "ranger", "assassin"],
      levels: [
        { level: 1, expectedLift: 0.2, roles: ["berserker", "ranger", "assassin"], attackSpeedMult: 1.18, physicalPowerMult: 1.08, teamBonus: { minMatches: 2, attackSpeedMult: 1.06 } },
        { level: 2, expectedLift: 0.4, roles: ["berserker", "ranger", "assassin"], attackSpeedMult: 1.42, physicalPowerMult: 1.17, teamBonus: { minMatches: 2, attackSpeedMult: 1.12, physicalPowerMult: 1.06 } },
        { level: 3, expectedLift: 0.7, roles: ["berserker", "ranger", "assassin"], attackSpeedMult: 1.95, physicalPowerMult: 1.34, teamBonus: { minMatches: 2, attackSpeedMult: 1.25, physicalPowerMult: 1.12 } },
      ],
      favorableTeams: [
        ["berserker", "ranger", "assassin", "bard"],
        ["knight", "berserker", "ranger", "assassin"],
        ["berserker", "assassin", "ranger", "ranger"],
        ["berserker", "berserker", "ranger", "bard"],
        ["assassin", "assassin", "ranger", "priest"],
      ],
      risk: "Could over-buff already good physical shells. Compare against Iron Oath teams.",
    },
    {
      id: "frost_clock",
      name: "Frost Clock",
      short: "Control teams buy enough time for slow payoff damage.",
      family: "control_payoff",
      targetSignal: "Ranger/mage/bard/alchemist teams should win by delaying enemy rotations.",
      favoredRoles: ROLE_GROUPS.control,
      levels: [
        { level: 1, expectedLift: 0.2, roles: ROLE_GROUPS.control, skillHasteMult: 1.06, effectPowerMult: 1.1, hpMult: 1.04 },
        { level: 2, expectedLift: 0.4, roles: ROLE_GROUPS.control, skillHasteMult: 1.14, effectPowerMult: 1.22, hpMult: 1.08 },
        { level: 3, expectedLift: 0.7, roles: ROLE_GROUPS.control, skillHasteMult: 1.26, effectPowerMult: 1.42, hpMult: 1.15 },
      ],
      favorableTeams: [
        ["warrior", "ranger", "mage", "bard"],
        ["knight", "mage", "alchemist", "priest"],
        ["warrior", "ranger", "alchemist", "bard"],
        ["knight", "mage", "bard", "bard"],
        ["ranger", "mage", "alchemist", "bard"],
      ],
      risk: "Control is less explicit than damage. The lab should show expected winners clearly.",
    },
    {
      id: "crown_relay",
      name: "Crown Relay",
      short: "Support shells route resources into one visible carry.",
      family: "carry_resource_routing",
      scope: "left",
      targetSignal: "Knight/priest/bard/warlock shells should make one carry's damage and survival jump, not buff every random team.",
      favoredRoles: ROLE_GROUPS.carryRouting,
      levels: [
        { level: 1, expectedLift: 0.2, triggerRoles: ["knight", "priest", "bard", "warlock"], requiresTriggerMin: 2, roles: ["ranger", "berserker", "assassin", "mage"], powerMult: 1.15, receivedHealingMult: 1.04, skillHasteMult: 1.04, teamBonus: { minMatches: 2, powerMult: 1.08, receivedHealingMult: 1.04 } },
        { level: 2, expectedLift: 0.4, triggerRoles: ["knight", "priest", "bard", "warlock"], requiresTriggerMin: 2, roles: ["ranger", "berserker", "assassin", "mage"], powerMult: 1.32, receivedHealingMult: 1.08, skillHasteMult: 1.1, teamBonus: { minMatches: 2, powerMult: 1.14, receivedHealingMult: 1.08 } },
        { level: 3, expectedLift: 0.7, triggerRoles: ["knight", "priest", "bard", "warlock"], requiresTriggerMin: 2, roles: ["ranger", "berserker", "assassin", "mage"], powerMult: 1.6, receivedHealingMult: 1.14, skillHasteMult: 1.18, teamBonus: { minMatches: 2, powerMult: 1.22, receivedHealingMult: 1.12 } },
      ],
      favorableTeams: [
        ["knight", "priest", "bard", "ranger"],
        ["warrior", "priest", "bard", "berserker"],
        ["knight", "priest", "warlock", "mage"],
        ["bard", "priest", "warlock", "assassin"],
        ["knight", "bard", "ranger", "berserker"],
      ],
      risk: "If the support package becomes universal, it can turn into a generic all-team stat field. Watch non-support teams.",
    },
    {
      id: "many_target_hall",
      name: "Many-Target Hall",
      short: "Wide pressure teams get paid for damaging several enemies together.",
      family: "area_pressure",
      targetSignal: "Warrior/mage/alchemist/ranger teams should lower several enemy HP bars together instead of only deleting one unit.",
      favoredRoles: ROLE_GROUPS.areaPressure,
      levels: [
        { level: 1, expectedLift: 0.2, roles: ROLE_GROUPS.areaPressure, powerMult: 1.04, skillHasteMult: 1.02, teamBonus: { minMatches: 2, powerMult: 1.02 } },
        { level: 2, expectedLift: 0.4, roles: ROLE_GROUPS.areaPressure, powerMult: 1.08, skillHasteMult: 1.035, teamBonus: { minMatches: 2, powerMult: 1.035, skillHasteMult: 1.015 } },
        { level: 3, expectedLift: 0.7, roles: ROLE_GROUPS.areaPressure, powerMult: 1.18, skillHasteMult: 1.08, teamBonus: { minMatches: 2, powerMult: 1.08, skillHasteMult: 1.04 } },
      ],
      favorableTeams: [
        ["warrior", "mage", "alchemist", "priest"],
        ["knight", "mage", "ranger", "bard"],
        ["warrior", "ranger", "mage", "alchemist"],
        ["warrior", "mage", "mage", "bard"],
        ["knight", "ranger", "alchemist", "priest"],
      ],
      risk: "Can blur into DOT or caster fields if mage/alchemist dominate. Watch whether warrior/ranger mixed teams also benefit.",
    },
    {
      id: "duelist_ring",
      name: "Duelist Ring",
      short: "Single-target killers get cleaner wins if they bring enough duel pressure.",
      family: "single_target_duel",
      targetSignal: "Warrior/assassin teams should win by quickly removing one key unit, not by outlasting everything.",
      favoredRoles: ROLE_GROUPS.duelPressure,
      levels: [
        { level: 1, expectedLift: 0.2, triggerRoles: ROLE_GROUPS.duelPressure, requiresTriggerMin: 1, roles: ["warrior", "assassin", "ranger"], physicalPowerMult: 1.14, attackSpeedMult: 1.04, teamBonus: { minMatches: 2, physicalPowerMult: 1.06 } },
        { level: 2, expectedLift: 0.4, triggerRoles: ROLE_GROUPS.duelPressure, requiresTriggerMin: 1, roles: ["warrior", "assassin", "ranger"], physicalPowerMult: 1.28, attackSpeedMult: 1.08, teamBonus: { minMatches: 2, physicalPowerMult: 1.1, attackSpeedMult: 1.03 } },
        { level: 3, expectedLift: 0.7, triggerRoles: ROLE_GROUPS.duelPressure, requiresTriggerMin: 1, roles: ["warrior", "assassin", "ranger"], physicalPowerMult: 1.48, attackSpeedMult: 1.14, teamBonus: { minMatches: 2, physicalPowerMult: 1.18, attackSpeedMult: 1.06 } },
      ],
      favorableTeams: [
        ["warrior", "assassin", "priest", "bard"],
        ["warrior", "warrior", "assassin", "priest"],
        ["knight", "warrior", "assassin", "ranger"],
        ["warrior", "assassin", "assassin", "bard"],
        ["berserker", "warrior", "assassin", "priest"],
      ],
      risk: "If double-assassin deletes every team, this becomes a burst stat check instead of a duel lesson.",
    },
    {
      id: "backline_beacon",
      name: "Backline Beacon",
      short: "Protected ranged lines get paid for keeping distance and casting cleanly.",
      family: "backline_focus",
      targetSignal: "Ranger/mage/bard backlines should show stable ranged pressure behind one or two bodies.",
      favoredRoles: ROLE_GROUPS.backlineFocus,
      levels: [
        { level: 1, expectedLift: 0.2, triggerRoles: ROLE_GROUPS.backlineFocus, requiresTriggerMin: 2, roles: ROLE_GROUPS.backlineFocus, powerMult: 1.1, skillHasteMult: 1.04, attackSpeedMult: 1.04 },
        { level: 2, expectedLift: 0.4, triggerRoles: ROLE_GROUPS.backlineFocus, requiresTriggerMin: 2, roles: ROLE_GROUPS.backlineFocus, powerMult: 1.22, skillHasteMult: 1.09, attackSpeedMult: 1.08 },
        { level: 3, expectedLift: 0.7, triggerRoles: ROLE_GROUPS.backlineFocus, requiresTriggerMin: 2, roles: ROLE_GROUPS.backlineFocus, powerMult: 1.42, skillHasteMult: 1.16, attackSpeedMult: 1.14 },
      ],
      favorableTeams: [
        ["knight", "ranger", "mage", "bard"],
        ["warrior", "ranger", "mage", "priest"],
        ["knight", "ranger", "ranger", "bard"],
        ["warrior", "mage", "mage", "bard"],
        ["knight", "mage", "bard", "priest"],
      ],
      risk: "Too broad if every standard balanced team benefits equally from having one ranged unit.",
    },
    {
      id: "plague_workshop",
      name: "Plague Workshop",
      short: "Poison and curse crafters convert setup time into pressure.",
      family: "plague_craft",
      targetSignal: "Alchemist/warlock teams should feel like they are building an engine over time.",
      favoredRoles: ROLE_GROUPS.plagueCraft,
      levels: [
        { level: 1, expectedLift: 0.2, triggerRoles: ROLE_GROUPS.plagueCraft, requiresTriggerMin: 1, roles: ["warlock", "alchemist", "mage"], magicPowerMult: 1.08, effectPowerMult: 1.16, skillHasteMult: 1.03 },
        { level: 2, expectedLift: 0.4, triggerRoles: ROLE_GROUPS.plagueCraft, requiresTriggerMin: 1, roles: ["warlock", "alchemist", "mage"], magicPowerMult: 1.18, effectPowerMult: 1.38, skillHasteMult: 1.07 },
        { level: 3, expectedLift: 0.7, triggerRoles: ROLE_GROUPS.plagueCraft, requiresTriggerMin: 1, roles: ["warlock", "alchemist", "mage"], magicPowerMult: 1.32, effectPowerMult: 1.75, skillHasteMult: 1.12 },
      ],
      favorableTeams: [
        ["knight", "warlock", "alchemist", "priest"],
        ["warrior", "warlock", "alchemist", "bard"],
        ["warlock", "warlock", "alchemist", "priest"],
        ["knight", "mage", "warlock", "alchemist"],
        ["berserker", "warlock", "alchemist", "priest"],
      ],
      risk: "May overlap Ember Air. It should be the alchemist/warlock engine version, not generic burn/poison.",
    },
    {
      id: "banner_march",
      name: "Banner March",
      short: "Ordered frontlines get broad but disciplined formation value.",
      family: "formation_banner",
      targetSignal: "Warrior/knight/bard teams should feel safer and more consistent, not explosively stronger.",
      favoredRoles: ROLE_GROUPS.bannerFormation,
      levels: [
        { level: 1, expectedLift: 0.2, triggerRoles: ROLE_GROUPS.bannerFormation, requiresTriggerMin: 2, roles: ROLE_GROUPS.bannerFormation, hpMult: 1.15, armorMult: 1.18, powerMult: 1.06, teamBonus: { minMatches: 3, hpMult: 1.1, armorMult: 1.06 } },
        { level: 2, expectedLift: 0.4, triggerRoles: ROLE_GROUPS.bannerFormation, requiresTriggerMin: 2, roles: ROLE_GROUPS.bannerFormation, hpMult: 1.14, armorMult: 1.18, powerMult: 1.08, teamBonus: { minMatches: 3, hpMult: 1.1, armorMult: 1.08 } },
        { level: 3, expectedLift: 0.7, triggerRoles: ROLE_GROUPS.bannerFormation, requiresTriggerMin: 2, roles: ROLE_GROUPS.bannerFormation, hpMult: 1.28, armorMult: 1.36, powerMult: 1.14, teamBonus: { minMatches: 3, hpMult: 1.18, armorMult: 1.16 } },
      ],
      favorableTeams: [
        ["warrior", "knight", "bard", "ranger"],
        ["warrior", "knight", "bard", "priest"],
        ["warrior", "warrior", "knight", "bard"],
        ["knight", "knight", "bard", "mage"],
        ["warrior", "knight", "bard", "berserker"],
      ],
      risk: "If too strong, it becomes the boring safe answer for every dungeon.",
    },
    {
      id: "consecrated_well",
      name: "Consecrated Well",
      short: "Healing and shielding shells become a clear recovery check.",
      family: "healing_sanctum",
      targetSignal: "Priest/knight/bard teams should visibly recover between enemy waves of pressure.",
      favoredRoles: ROLE_GROUPS.sanctumShell,
      levels: [
        { level: 1, expectedLift: 0.2, triggerRoles: ROLE_GROUPS.sanctumShell, requiresTriggerMin: 2, roles: ROLE_GROUPS.sanctumShell, receivedHealingMult: 1.28, magicPowerMult: 1.18, hpMult: 1.18, armorMult: 1.12, skillHasteMult: 1.05 },
        { level: 2, expectedLift: 0.4, triggerRoles: ROLE_GROUPS.sanctumShell, requiresTriggerMin: 2, roles: ROLE_GROUPS.sanctumShell, receivedHealingMult: 2.0, magicPowerMult: 1.5, hpMult: 1.55, armorMult: 1.42, skillHasteMult: 1.18 },
        { level: 3, expectedLift: 0.7, triggerRoles: ROLE_GROUPS.sanctumShell, requiresTriggerMin: 2, roles: ROLE_GROUPS.sanctumShell, receivedHealingMult: 3.25, magicPowerMult: 2.25, hpMult: 2.35, armorMult: 1.95, skillHasteMult: 1.42 },
      ],
      favorableTeams: [
        ["knight", "priest", "bard", "ranger"],
        ["warrior", "knight", "priest", "bard"],
        ["knight", "priest", "priest", "mage"],
        ["knight", "bard", "bard", "berserker"],
        ["knight", "priest", "bard", "warlock"],
      ],
      risk: "Can be boring if it only prevents death without creating a second-rotation payoff.",
    },
    {
      id: "witching_hour",
      name: "Witching Hour",
      short: "Late skill windows for dark and arcane casters become more lethal.",
      family: "witching_burst",
      scope: "left",
      targetSignal: "Mage/warlock/bard teams should spike harder on repeated skill rotations.",
      favoredRoles: ROLE_GROUPS.witchingBurst,
      levels: [
        { level: 1, expectedLift: 0.2, triggerRoles: ROLE_GROUPS.witchingBurst, requiresTriggerMin: 1, roles: ROLE_GROUPS.witchingBurst, magicPowerMult: 1.18, skillHasteMult: 1.08 },
        { level: 2, expectedLift: 0.4, triggerRoles: ROLE_GROUPS.witchingBurst, requiresTriggerMin: 1, roles: ROLE_GROUPS.witchingBurst, magicPowerMult: 1.34, skillHasteMult: 1.15 },
        { level: 3, expectedLift: 0.7, triggerRoles: ROLE_GROUPS.witchingBurst, requiresTriggerMin: 1, roles: ROLE_GROUPS.witchingBurst, magicPowerMult: 1.72, skillHasteMult: 1.32 },
      ],
      favorableTeams: [
        ["knight", "mage", "warlock", "bard"],
        ["warrior", "mage", "warlock", "priest"],
        ["knight", "mage", "mage", "bard"],
        ["warrior", "warlock", "warlock", "bard"],
        ["mage", "warlock", "bard", "priest"],
      ],
      risk: "Can duplicate Arcane Tide unless warlock/bard mixed teams are the clearest winners.",
    },
    {
      id: "thorn_maze",
      name: "Thorn Maze",
      short: "Kiting and control teams buy time for ranged attrition.",
      family: "kite_control",
      targetSignal: "Ranger/alchemist/bard teams should win by delaying contact and stretching the fight.",
      favoredRoles: ROLE_GROUPS.thornControl,
      levels: [
        { level: 1, expectedLift: 0.2, triggerRoles: ROLE_GROUPS.thornControl, requiresTriggerMin: 2, roles: ROLE_GROUPS.thornControl, skillHasteMult: 1.03, effectPowerMult: 1.05, attackSpeedMult: 1.02 },
        { level: 2, expectedLift: 0.4, triggerRoles: ROLE_GROUPS.thornControl, requiresTriggerMin: 2, roles: ROLE_GROUPS.thornControl, skillHasteMult: 1.08, effectPowerMult: 1.13, attackSpeedMult: 1.05 },
        { level: 3, expectedLift: 0.7, triggerRoles: ROLE_GROUPS.thornControl, requiresTriggerMin: 2, roles: ROLE_GROUPS.thornControl, skillHasteMult: 1.16, effectPowerMult: 1.28, attackSpeedMult: 1.09 },
      ],
      favorableTeams: [
        ["warrior", "ranger", "alchemist", "bard"],
        ["knight", "ranger", "alchemist", "priest"],
        ["ranger", "ranger", "alchemist", "bard"],
        ["warrior", "ranger", "bard", "mage"],
        ["knight", "alchemist", "bard", "warlock"],
      ],
      risk: "Control payoff can be invisible without battle signals; keep it numerically distinct from Frost Clock.",
    },
    {
      id: "red_anvil",
      name: "Red Anvil",
      short: "Brawl teams convert healing support into violent staying power.",
      family: "brawl_recovery",
      targetSignal: "Berserker/warrior/priest teams should survive long enough for melee pressure to matter.",
      favoredRoles: ROLE_GROUPS.redAnvil,
      levels: [
        { level: 1, expectedLift: 0.2, triggerRoles: ROLE_GROUPS.redAnvil, requiresTriggerMin: 2, roles: ROLE_GROUPS.redAnvil, hpMult: 1.08, physicalPowerMult: 1.08, receivedHealingMult: 1.08 },
        { level: 2, expectedLift: 0.4, triggerRoles: ROLE_GROUPS.redAnvil, requiresTriggerMin: 2, roles: ROLE_GROUPS.redAnvil, hpMult: 1.2, physicalPowerMult: 1.18, receivedHealingMult: 1.18 },
        { level: 3, expectedLift: 0.7, triggerRoles: ROLE_GROUPS.redAnvil, requiresTriggerMin: 2, roles: ROLE_GROUPS.redAnvil, hpMult: 1.38, physicalPowerMult: 1.34, receivedHealingMult: 1.34 },
      ],
      favorableTeams: [
        ["warrior", "berserker", "priest", "bard"],
        ["warrior", "berserker", "berserker", "priest"],
        ["knight", "warrior", "berserker", "priest"],
        ["warrior", "berserker", "priest", "warlock"],
        ["berserker", "berserker", "priest", "alchemist"],
      ],
      risk: "May overlap Blood Moon; it should be priest-supported brawl, not pure low-health comeback.",
    },
    {
      id: "spellblade_corridor",
      name: "Spellblade Corridor",
      short: "Hybrid physical-magical teams are rewarded for split scaling.",
      family: "hybrid_spellblade",
      scope: "left",
      targetSignal: "Warrior/mage/assassin mixes should show value from both physical and magical pressure.",
      favoredRoles: ROLE_GROUPS.spellblade,
      levels: [
        { level: 1, expectedLift: 0.2, triggerRoles: ROLE_GROUPS.spellblade, requiresTriggerMin: 2, roles: ROLE_GROUPS.spellblade, physicalPowerMult: 1.18, magicPowerMult: 1.18, skillHasteMult: 1.06, hpMult: 1.04 },
        { level: 2, expectedLift: 0.4, triggerRoles: ROLE_GROUPS.spellblade, requiresTriggerMin: 2, roles: ROLE_GROUPS.spellblade, physicalPowerMult: 1.42, magicPowerMult: 1.42, skillHasteMult: 1.14, hpMult: 1.08 },
        { level: 3, expectedLift: 0.7, triggerRoles: ROLE_GROUPS.spellblade, requiresTriggerMin: 2, roles: ROLE_GROUPS.spellblade, physicalPowerMult: 2.35, magicPowerMult: 2.35, skillHasteMult: 1.42, hpMult: 1.28 },
      ],
      favorableTeams: [
        ["warrior", "mage", "assassin", "priest"],
        ["knight", "warrior", "mage", "assassin"],
        ["warrior", "mage", "mage", "assassin"],
        ["warrior", "assassin", "warlock", "mage"],
        ["berserker", "warrior", "mage", "assassin"],
      ],
      risk: "If hybrid becomes simply better than focused damage, it hurts build identity.",
    },
    {
      id: "breakers_yard",
      name: "Breaker's Yard",
      short: "Disruption teams get paid for cracking defensive shells.",
      family: "defense_breaker",
      targetSignal: "Warrior/alchemist/assassin teams should be better into shield or stall shells without becoming universal.",
      favoredRoles: ROLE_GROUPS.breakerYard,
      levels: [
        { level: 1, expectedLift: 0.2, triggerRoles: ROLE_GROUPS.breakerYard, requiresTriggerMin: 1, roles: ROLE_GROUPS.breakerYard, powerMult: 1.01, effectPowerMult: 1.01, attackSpeedMult: 1.005 },
        { level: 2, expectedLift: 0.4, triggerRoles: ROLE_GROUPS.breakerYard, requiresTriggerMin: 1, roles: ROLE_GROUPS.breakerYard, powerMult: 1.1, effectPowerMult: 1.08, attackSpeedMult: 1.04 },
        { level: 3, expectedLift: 0.7, triggerRoles: ROLE_GROUPS.breakerYard, requiresTriggerMin: 1, roles: ROLE_GROUPS.breakerYard, powerMult: 1.2, effectPowerMult: 1.14, attackSpeedMult: 1.07 },
      ],
      favorableTeams: [
        ["warrior", "alchemist", "assassin", "priest"],
        ["knight", "warrior", "alchemist", "assassin"],
        ["warrior", "alchemist", "assassin", "ranger"],
        ["warrior", "warrior", "alchemist", "assassin"],
        ["berserker", "warrior", "alchemist", "assassin"],
      ],
      risk: "Without true shield-damage hooks this is only an approximation; later should become an anti-shield rule.",
    },
    {
      id: "purging_rain",
      name: "Purging Rain",
      short: "Status-pressure teams and healers get tools to stabilize against burn, poison, and pressure.",
      family: "status_recovery",
      scope: "left",
      active: false,
      status: "needs runtime status-pressure validation before promotion",
      targetSignal: "Priest/alchemist/warlock/knight teams should survive status pressure better without becoming a generic shield wall.",
      favoredRoles: ROLE_GROUPS.statusRecovery,
      levels: [
        { level: 1, expectedLift: 0.2, roles: ROLE_GROUPS.statusRecovery, effectResistPct: 0.06, receivedHealingMult: 1.08, magicPowerMult: 1.04, teamBonus: { minMatches: 3, hpMult: 1.06, receivedHealingMult: 1.05 } },
        { level: 2, expectedLift: 0.4, roles: ROLE_GROUPS.statusRecovery, effectResistPct: 0.12, receivedHealingMult: 1.18, magicPowerMult: 1.1, skillHasteMult: 1.04, teamBonus: { minMatches: 3, hpMult: 1.14, receivedHealingMult: 1.1 } },
        { level: 3, expectedLift: 0.7, roles: ROLE_GROUPS.statusRecovery, effectResistPct: 0.2, receivedHealingMult: 1.34, magicPowerMult: 1.18, skillHasteMult: 1.08, teamBonus: { minMatches: 3, hpMult: 1.25, receivedHealingMult: 1.18 } },
      ],
      favorableTeams: [
        ["knight", "priest", "alchemist", "warlock"],
        ["warrior", "priest", "alchemist", "mage"],
        ["knight", "priest", "priest", "warlock"],
        ["knight", "alchemist", "warlock", "bard"],
        ["warrior", "priest", "warlock", "mage"],
      ],
      risk: "If it beats ordinary physical teams equally well, it is too broad. It should be strongest where status and recovery matter.",
    },
  ];

  function effectById(id) {
    return EFFECTS.find((effect) => effect.id === id) || EFFECTS[0];
  }

  function materializeUnit(spec, index = 0) {
    const role = SKILL_DATA.roleKits?.[spec.role] || {};
    const kit = role.kit || {};
    return {
      id: spec.id || `${spec.role || "unit"}-${index}`,
      role: spec.role,
      name: spec.name || role.name || spec.role,
      roleName: spec.roleName || role.role || spec.role,
      icon: spec.icon || role.icon,
      small1: spec.small1 || kit.small1,
      small2: spec.small2 || kit.small2,
      passive: spec.passive || kit.passive,
      ultimate: spec.ultimate || kit.ultimate,
      hp: spec.hp ?? role.hp,
      power: spec.power ?? role.power,
      physicalPower: spec.physicalPower ?? spec.power ?? role.power,
      magicPower: spec.magicPower ?? spec.power ?? role.power,
      armor: spec.armor ?? role.armor,
      range: spec.range ?? role.range,
      attackSpeedMult: spec.attackSpeedMult ?? 1,
      skillHasteMult: spec.skillHasteMult ?? 1,
      effectPowerMult: spec.effectPowerMult ?? 1,
      effectResistPct: spec.effectResistPct ?? 0,
      receivedHealingMult: spec.receivedHealingMult ?? 1,
      slotIndex: Number.isFinite(spec.slotIndex) ? spec.slotIndex : index,
    };
  }

  function roleTeam(roles, name = "team") {
    return roles.map((role, index) => materializeUnit({ role, id: `${name}-${role}-${index}` }, index));
  }

  function applyFieldEffectToTeam(team, fieldId, level = 1, options = {}) {
    const effect = effectById(fieldId);
    const levelSpec = effect.levels[Math.max(0, Math.min(effect.levels.length - 1, level - 1))];
    const triggerRoles = levelSpec.triggerRoles || levelSpec.roles;
    const matchCount = team.filter((unit) => triggerRoles.includes(unit.role)).length;
    return team.map((unit, index) => applyLevelSpec(materializeUnit(unit, index), levelSpec, { ...options, matchCount }));
  }

  function applyFieldEffectToTeams(leftTeam, rightTeam, fieldId, level = 1, options = {}) {
    const effect = effectById(fieldId);
    const scope = options.scope || effect.scope || "both";
    return {
      effect,
      level,
      leftTeam: scope === "right" ? leftTeam.map(materializeUnit) : applyFieldEffectToTeam(leftTeam, fieldId, level, options),
      rightTeam: scope === "left" ? rightTeam.map(materializeUnit) : applyFieldEffectToTeam(rightTeam, fieldId, level, options),
    };
  }

  function applyLevelSpec(unit, spec, context = {}) {
    if (spec.requiresTriggerMin && (context.matchCount || 0) < spec.requiresTriggerMin) return unit;
    const affectedRoles = spec.affectedRoles || spec.roles;
    if (!affectedRoles.includes(unit.role)) return unit;
    const out = { ...unit };
    applyModifiers(out, spec);
    if (spec.teamBonus && (context.matchCount || 0) >= spec.teamBonus.minMatches) {
      applyModifiers(out, spec.teamBonus);
    }
    out.fieldEffectTags = [...(out.fieldEffectTags || []), `${spec.level}`];
    return out;
  }

  function applyModifiers(out, spec) {
    if (Number.isFinite(spec.hpMult)) out.hp = Math.round(out.hp * spec.hpMult);
    if (Number.isFinite(spec.armorMult)) out.armor = Math.round(out.armor * spec.armorMult);
    if (Number.isFinite(spec.armorAdd)) out.armor += spec.armorAdd;
    if (Number.isFinite(spec.physicalPowerMult)) out.physicalPower = Math.round(out.physicalPower * spec.physicalPowerMult);
    if (Number.isFinite(spec.magicPowerMult)) out.magicPower = Math.round(out.magicPower * spec.magicPowerMult);
    if (Number.isFinite(spec.powerMult)) {
      out.power = Math.round(out.power * spec.powerMult);
      out.physicalPower = Math.round(out.physicalPower * spec.powerMult);
      out.magicPower = Math.round(out.magicPower * spec.powerMult);
    }
    if (Number.isFinite(spec.attackSpeedMult)) out.attackSpeedMult *= spec.attackSpeedMult;
    if (Number.isFinite(spec.skillHasteMult)) out.skillHasteMult *= spec.skillHasteMult;
    if (Number.isFinite(spec.effectPowerMult)) out.effectPowerMult *= spec.effectPowerMult;
    if (Number.isFinite(spec.effectResistPct)) out.effectResistPct = Math.min(0.5, out.effectResistPct + spec.effectResistPct);
    if (Number.isFinite(spec.receivedHealingMult)) out.receivedHealingMult *= spec.receivedHealingMult;
  }

  const STANDARD_TEAMS = [
    { id: "balanced", name: "Balanced", roles: ["warrior", "knight", "mage", "priest"] },
    { id: "physical", name: "Physical Core", roles: ["warrior", "berserker", "ranger", "priest"] },
    { id: "hunter", name: "Hunter Shell", roles: ["knight", "assassin", "ranger", "bard"] },
    { id: "dot_magic", name: "Dot Magic", roles: ["knight", "warlock", "alchemist", "priest"] },
    { id: "control", name: "Control", roles: ["warrior", "ranger", "mage", "bard"] },
    { id: "shield", name: "Shield Shell", roles: ["knight", "knight", "priest", "bard"] },
    { id: "low_hp", name: "Low HP Brawl", roles: ["warrior", "berserker", "warlock", "priest"] },
    { id: "caster", name: "Caster Burst", roles: ["knight", "mage", "mage", "bard"] },
  ];

  return {
    version: "2026-07-07-field-effects-v1",
    roleGroups: ROLE_GROUPS,
    allEffects: EFFECTS,
    effects: EFFECTS.filter((effect) => effect.active !== false),
    standardTeams: STANDARD_TEAMS,
    effectById,
    roleTeam,
    materializeUnit,
    applyFieldEffectToTeam,
    applyFieldEffectToTeams,
  };
})();

if (typeof window !== "undefined") window.GAME_FIELD_EFFECTS = GAME_FIELD_EFFECTS;
if (typeof module !== "undefined") module.exports = GAME_FIELD_EFFECTS;
