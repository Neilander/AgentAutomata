const crypto = require("node:crypto");

const PROFILE_SCHEMA = "player_profile_v1";
const PROFILE_STATE_SCHEMA = "player_profile_state_v1";
const PRIOR_SCHEMA = "player_causal_prior_v1";

const DEFINITIONS = [
  profile("open_novice", "Open novice", "Weak priors; explores visible options and updates quickly from clear evidence.", {
    riskTolerance: 0.5, exploration: 0.8, changeAversion: 0.2, evidenceThreshold: 0.35,
    preferences: { damage: 0.45, survival: 0.45, novelty: 0.75, rarity: 0.35, simplicity: 0.5 },
  }, [
    prior("visible experiments", "trying a newly visible option", "may reveal a useful strategy", 0.42),
  ]),
  profile("damage_absolutist", "Damage absolutist", "Believes direct damage solves most combat problems and initially discounts sustain.", {
    riskTolerance: 0.75, exploration: 0.35, changeAversion: 0.35, evidenceThreshold: 0.62,
    preferences: { damage: 1, survival: 0.15, novelty: 0.3, rarity: 0.35, simplicity: 0.7 },
  }, [
    prior("player team", "maximizing direct damage", "raises win probability", 0.84),
    prior("player team", "using healing or defensive slots", "reduces combat tempo", 0.72),
  ]),
  profile("safety_conservative", "Safety conservative", "Values frontline stability and healing, and avoids uncertain fights after failure.", {
    riskTolerance: 0.2, exploration: 0.3, changeAversion: 0.4, evidenceThreshold: 0.48,
    preferences: { damage: 0.35, survival: 1, novelty: 0.2, rarity: 0.3, simplicity: 0.65 },
  }, [
    prior("player team", "protecting the frontline with healing", "creates enough time to win", 0.8),
    prior("uncertain encounter", "retrying without a clear improvement", "is likely to fail again", 0.68),
  ]),
  profile("healer_believer", "Healer believer", "Treats a dedicated sustain role as the default foundation of a valid team.", {
    riskTolerance: 0.38, exploration: 0.4, changeAversion: 0.52, evidenceThreshold: 0.64,
    preferences: { damage: 0.4, survival: 0.9, novelty: 0.35, rarity: 0.3, simplicity: 0.55 },
  }, [
    prior("player team", "fielding a dedicated healer", "improves consistency across encounters", 0.86),
  ]),
  profile("low_friction_optimizer", "Low-friction optimizer", "Changes team and equipment readily when recent evidence predicts a measurable gain.", {
    riskTolerance: 0.55, exploration: 0.65, changeAversion: 0.05, evidenceThreshold: 0.3,
    preferences: { damage: 0.65, survival: 0.6, novelty: 0.45, rarity: 0.25, simplicity: 0.25 },
  }, [
    prior("player build", "testing a visible upgrade after comparison", "often improves the next result", 0.7),
  ]),
  profile("inertial_player", "Inertial player", "Dislikes menus and composition changes; prefers another attempt with the current setup.", {
    riskTolerance: 0.58, exploration: 0.16, changeAversion: 0.92, evidenceThreshold: 0.82,
    preferences: { damage: 0.55, survival: 0.5, novelty: 0.1, rarity: 0.25, simplicity: 1 },
  }, [
    prior("current team", "retrying a familiar encounter", "is cheaper than rebuilding", 0.78),
  ]),
  profile("novelty_collector", "Novelty collector", "Prioritizes newly unlocked heroes and untested options even before their value is proven.", {
    riskTolerance: 0.6, exploration: 1, changeAversion: 0.08, evidenceThreshold: 0.22,
    preferences: { damage: 0.4, survival: 0.35, novelty: 1, rarity: 0.75, simplicity: 0.2 },
  }, [
    prior("newly unlocked option", "testing it in the next suitable encounter", "is valuable even when power is uncertain", 0.88),
  ]),
  profile("rarity_chaser", "Rarity chaser", "Initially treats rarity as a stronger quality signal than build fit.", {
    riskTolerance: 0.52, exploration: 0.5, changeAversion: 0.22, evidenceThreshold: 0.7,
    preferences: { damage: 0.5, survival: 0.45, novelty: 0.55, rarity: 1, simplicity: 0.5 },
  }, [
    prior("equipment", "equipping the highest-rarity available item", "usually raises team strength", 0.82),
  ]),
  profile("single_carry_builder", "Single-carry builder", "Concentrates upgrades and protection around one perceived damage carry.", {
    riskTolerance: 0.62, exploration: 0.36, changeAversion: 0.58, evidenceThreshold: 0.57,
    preferences: { damage: 0.88, survival: 0.46, novelty: 0.25, rarity: 0.45, simplicity: 0.7 },
  }, [
    prior("player team", "concentrating upgrades on the top damage dealer", "scales better than spreading resources", 0.79),
  ]),
  profile("retry_grinder", "Retry grinder", "Accepts repeated failures and expects persistence plus small upgrades to eventually break a wall.", {
    riskTolerance: 0.82, exploration: 0.24, changeAversion: 0.7, evidenceThreshold: 0.76,
    preferences: { damage: 0.6, survival: 0.45, novelty: 0.18, rarity: 0.42, simplicity: 0.82 },
  }, [
    prior("failed encounter", "retrying after a small power increase", "can eventually produce a clear", 0.83),
  ]),
];

function profile(id, label, summary, decisionBias, priorBeliefs) {
  return { schema: PROFILE_SCHEMA, id, label, summary, decisionBias, priorBeliefs };
}

function prior(subject, behavior, result, confidence) {
  return {
    schema: PRIOR_SCHEMA,
    subject: { kind: "concept", id: slug(subject), label: subject },
    environment: { kind: "context", id: "general_gameplay", label: "general gameplay" },
    behavior: { kind: "causal_behavior", id: slug(behavior), label: behavior },
    result: { kind: "expected_result", id: slug(result), label: result },
    confidence,
    source: "prior_game_habit",
    status: "unverified_prior",
  };
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function listPlayerProfiles() {
  return clone(DEFINITIONS);
}

function getPlayerProfile(profileId = "open_novice") {
  const profile = DEFINITIONS.find((row) => row.id === profileId);
  if (!profile) throw new Error(`unknown player profile: ${profileId}`);
  return clone(profile);
}

function createProfileState(profileId = "open_novice") {
  const profile = getPlayerProfile(profileId);
  return {
    schema: PROFILE_STATE_SCHEMA,
    profileId: profile.id,
    label: profile.label,
    summary: profile.summary,
    decisionBias: profile.decisionBias,
    priorBeliefs: profile.priorBeliefs.map((belief, index) => ({
      ...belief,
      id: `prior:${profile.id}:${index + 1}`,
    })),
  };
}

function ensureProfileState(value, fallbackProfileId = "open_novice") {
  if (!value || value.schema !== PROFILE_STATE_SCHEMA || !value.profileId) {
    return createProfileState(fallbackProfileId);
  }
  const canonical = createProfileState(value.profileId);
  return {
    ...canonical,
    priorBeliefs: Array.isArray(value.priorBeliefs) ? clone(value.priorBeliefs) : canonical.priorBeliefs,
  };
}

function selectPlayerProfiles(options = {}) {
  const exactIds = Array.isArray(options.profileIds)
    ? options.profileIds.map(String).filter(Boolean)
    : [];
  if (exactIds.length) {
    const uniqueIds = [...new Set(exactIds)];
    if (uniqueIds.length !== exactIds.length) throw new Error("profileIds must be unique");
    return uniqueIds.map(getPlayerProfile);
  }

  const count = Math.max(1, Math.floor(Number(options.profileCount) || 1));
  if (count > DEFINITIONS.length) {
    throw new Error(`profileCount cannot exceed ${DEFINITIONS.length}`);
  }
  const seed = String(options.selectionSeed || "player-profile-selection");
  return listPlayerProfiles()
    .map((row) => ({ row, order: hash(`${seed}:${row.id}`) }))
    .sort((a, b) => a.order.localeCompare(b.order) || a.row.id.localeCompare(b.row.id))
    .slice(0, count)
    .map((entry) => entry.row);
}

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function clone(value) {
  return structuredClone(value);
}

module.exports = {
  PRIOR_SCHEMA,
  PROFILE_SCHEMA,
  PROFILE_STATE_SCHEMA,
  createProfileState,
  ensureProfileState,
  getPlayerProfile,
  listPlayerProfiles,
  selectPlayerProfiles,
};
