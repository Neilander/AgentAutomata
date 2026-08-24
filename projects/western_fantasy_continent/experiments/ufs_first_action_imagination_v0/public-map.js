"use strict";

// Public board geometry and printed symbols only. Keeping this small entry
// beside the session API lets blind players construct a session without
// opening scenario drivers, fixed choices, or the formal game engine.
module.exports = require(
  "../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/fixtures/roswell-threat-0-map"
);
