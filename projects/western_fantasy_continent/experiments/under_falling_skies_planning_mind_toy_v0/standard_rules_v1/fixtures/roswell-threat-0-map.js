"use strict";

const base = require("./roswell-base-ab");
const sky = require("./roswell-sky-threat-0");

module.exports = {
  schema: "ufs_standard_map_v1",
  id: "roswell-ab-threat-0",
  label: "Roswell · 基地 A+B · 威胁 0",
  columns: 5,
  threatLevel: 0,
  city: {
    id: "roswell",
    label: "Roswell（未受损面）",
    maxDamage: 7,
    startEnergy: 2,
    maxEnergy: 7,
    robotLimit: 2,
    firstRoll: null,
  },
  research: {
    // User read these from bottom to top, beginning after the marker's
    // starting space. The final 11 is the winning space.
    costs: [3, 1, 3, 1, 4, 1, 3, 2, 1, 6, 1, 3, 5, 1, 3, 11],
    finalRequiresMultiSpace: true,
  },
  sky,
  base,
};
