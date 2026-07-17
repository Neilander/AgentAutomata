const fs = require("fs");
const path = require("path");
const MODEL = require("./entity-impression-model");
const { createSystematicSuites } = require("./systematic-preset-battle-suites");

const PROFILES = ["ordinary", "familiar", "expert"];
const OUTPUT = path.join(__dirname, "generated", "systematic-credibility-result.json");

function buildSystematicResult() {
  const suites = createSystematicSuites();
  const reportMatrix = analyzeReports(suites);
  const sequenceMatrix = analyzeAllOrders(suites);
  const checks = [
    checkObjectiveProfileInvariance(reportMatrix),
    checkProfileResolution(reportMatrix),
    checkNearThresholdTrait(reportMatrix),
    checkSubjectLocalPrimacy(suites),
    checkIdentityIsolation(suites),
    checkTraitIdentityIsolation(suites),
    checkTraitOrderStability(suites),
    checkCorrectionReachability(suites),
    checkFiniteOrderSensitivity(sequenceMatrix),
    checkConstantOutputConfounding(reportMatrix, suites),
    checkSimultaneousStrengthMatrix(),
    checkTopThirtyScaleRecalibration(),
    checkNegativeProfileBoundary(reportMatrix),
    checkTraitRevalidation(suites),
  ];
  const failures = checks.filter((check) => check.status === "fail");
  const warnings = checks.filter((check) => check.status === "warn");
  return {
    schema: "entity_impression_systematic_credibility_v1",
    fixtureDisclosure: "Four controlled suites use the live player-semantic report shape. Each suite contains five preset battles; they are not claimed as fresh combat simulation.",
    execution: {
      profiles: PROFILES,
      suiteCount: suites.length,
      battlesPerSuite: 5,
      permutationsPerSuite: 120,
      fiveBattleSequences: suites.length * PROFILES.length * 120,
      battleAnalysesAcrossSequences: suites.length * PROFILES.length * 120 * 5,
    },
    verdict: failures.length > 0 ? "revise" : warnings.length > 0 ? "credible_with_guardrails" : "credible",
    checks,
    suiteSummaries: sequenceMatrix,
    representativeSequences: buildRepresentativeSequences(suites),
    reportMatrix,
  };
}

function analyzeReports(suites) {
  return Object.fromEntries(suites.map((suite) => [suite.id, {
    purpose: suite.purpose,
    reports: Object.fromEntries(suite.reports.map((report) => [report.id, Object.fromEntries(
      PROFILES.map((profile) => [profile, compactAnalysis(MODEL.analyzeBattleReport(report, { profile }))]),
    )])),
  }]));
}

function compactAnalysis(analysis) {
  return {
    teamUsefulContribution: analysis.teamUsefulContribution,
    expectedUnitContribution: analysis.expectedUnitContribution,
    units: analysis.units.map((unit) => ({
      id: unit.id,
      usefulContribution: unit.usefulContribution,
      relativeStrengthPercent: unit.relativeStrengthPercent,
      strength: unit.strength,
      channels: unit.channels,
      domains: unit.domains,
      allyContext: unit.allyContext,
      traitObservations: unit.traitObservations.map((trait) => ({
        domain: trait.domain,
        rawMagnitudePercent: trait.rawMagnitudePercent,
        level: trait.level,
        eligible: trait.eligible,
      })),
      traits: unit.traits.map((trait) => ({
        domain: trait.domain,
        rawMagnitudePercent: trait.rawMagnitudePercent,
        level: trait.level,
        eligible: trait.eligible,
      })),
    })),
  };
}

function analyzeAllOrders(suites) {
  return Object.fromEntries(suites.map((suite) => {
    const permutations = permute(suite.reports.map((report) => report.id));
    const byId = new Map(suite.reports.map((report) => [report.id, report]));
    const profiles = Object.fromEntries(PROFILES.map((profile) => {
      const subjects = Object.fromEntries(suite.focalSubjects.map((subjectId) => [subjectId, []]));
      for (const order of permutations) {
        const state = runSequence(order, profile, byId);
        for (const subjectId of suite.focalSubjects) {
          const belief = MODEL.retrieveImpressions(state, subjectId)[0] || null;
          if (!belief) continue;
          subjects[subjectId].push({
            order,
            level: belief.claim.level,
            weightedSemanticLevel: belief.weightedSemanticLevel,
            rawPercent: belief.claim.rawPercent,
          });
        }
      }
      return [profile, Object.fromEntries(Object.entries(subjects).map(([subjectId, rows]) => [subjectId, summarizeOrderRows(rows)]))];
    }));
    return [suite.id, { purpose: suite.purpose, profiles }];
  }));
}

function summarizeOrderRows(rows) {
  if (rows.length === 0) return null;
  const sorted = rows.slice().sort((a, b) => a.weightedSemanticLevel - b.weightedSemanticLevel);
  const values = rows.map((row) => row.weightedSemanticLevel);
  return {
    permutationCount: rows.length,
    minimum: sorted[0],
    maximum: sorted.at(-1),
    spread: round(sorted.at(-1).weightedSemanticLevel - sorted[0].weightedSemanticLevel),
    mean: round(values.reduce((sum, value) => sum + value, 0) / values.length),
    distinctFinalLevels: [...new Set(rows.map((row) => row.level))].sort((a, b) => a - b),
  };
}

function buildRepresentativeSequences(suites) {
  return Object.fromEntries(suites.map((suite) => {
    const byId = new Map(suite.reports.map((report) => [report.id, report]));
    const natural = suite.reports.map((report) => report.id);
    const reversed = natural.slice().reverse();
    return [suite.id, Object.fromEntries(PROFILES.map((profile) => [profile, {
      natural: compactState(runSequence(natural, profile, byId), suite.focalSubjects),
      reversed: compactState(runSequence(reversed, profile, byId), suite.focalSubjects),
    }]))];
  }));
}

function compactState(state, subjectIds) {
  return {
    observations: state.strengthObservations
      .filter((row) => subjectIds.includes(row.subject.id))
      .map((row) => ({
        subjectId: row.subject.id,
        reportId: row.reportId,
        observationOrder: row.observationOrder,
        globalBattleOrder: row.globalBattleOrder,
        level: row.claim.level,
        rawPercent: row.claim.rawPercent,
      })),
    subjects: Object.fromEntries(subjectIds.map((subjectId) => [subjectId, {
      current: MODEL.retrieveImpressions(state, subjectId)[0] || null,
      knowledge: state.knowledge.filter((row) => row.subject.id === subjectId),
    }])),
  };
}

function checkObjectiveProfileInvariance(reportMatrix) {
  const differences = [];
  for (const [suiteId, suite] of Object.entries(reportMatrix)) {
    for (const [reportId, profiles] of Object.entries(suite.reports)) {
      const baseline = objectiveProjection(profiles.ordinary);
      for (const profile of ["familiar", "expert"]) {
        if (JSON.stringify(baseline) !== JSON.stringify(objectiveProjection(profiles[profile]))) {
          differences.push({ suiteId, reportId, profile });
        }
      }
    }
  }
  return check("objective_profile_invariance", differences.length === 0 ? "pass" : "fail",
    "Objective contribution and relative-strength evidence must not change with player profile.", { differences });
}

function objectiveProjection(analysis) {
  return analysis.units.map((unit) => ({
    id: unit.id,
    usefulContribution: unit.usefulContribution,
    relativeStrengthPercent: unit.relativeStrengthPercent,
    channels: unit.channels,
    domains: unit.domains,
  }));
}

function checkProfileResolution(reportMatrix) {
  let strengthDifferences = 0;
  let traitDifferences = 0;
  for (const suite of Object.values(reportMatrix)) {
    for (const profiles of Object.values(suite.reports)) {
      const unitIds = profiles.ordinary.units.map((unit) => unit.id);
      for (const unitId of unitIds) {
        const units = PROFILES.map((profile) => profiles[profile].units.find((unit) => unit.id === unitId));
        if (new Set(units.map((unit) => unit.strength.level)).size > 1) strengthDifferences += 1;
        const domains = new Set(units.flatMap((unit) => unit.traits.map((trait) => trait.domain)));
        for (const domain of domains) {
          const levels = units.map((unit) => unit.traits.find((trait) => trait.domain === domain)?.level || 0);
          if (new Set(levels).size > 1) traitDifferences += 1;
        }
      }
    }
  }
  const status = strengthDifferences > 0 && traitDifferences > 0 ? "pass" : "fail";
  return check("profile_resolution_is_observable", status,
    "The three scales should produce visible high-end distinctions while sharing objective evidence.", { strengthDifferences, traitDifferences });
}

function checkNearThresholdTrait(reportMatrix) {
  const profiles = reportMatrix.profile_trait_resolution.reports.ptr_mage_65;
  const hasArea = (profile) => profiles[profile].units.find((unit) => unit.id === "hero_mage")
    .traits.some((trait) => trait.domain === "area_damage");
  const observed = Object.fromEntries(PROFILES.map((profile) => [profile, hasArea(profile)]));
  const passed = !observed.ordinary && !observed.familiar && observed.expert;
  return check("near_threshold_trait_gate", passed ? "pass" : "fail",
    "At 65% domain magnitude, only the expert scale should reach the shared level-3 trait gate.", observed);
}

function checkSubjectLocalPrimacy(suites) {
  const suite = suites.find((entry) => entry.id === "roster_replacement_identity");
  const byId = new Map(suite.reports.map((report) => [report.id, report]));
  const a = ["rri_ranger_strong", "rri_ranger_weak", "rri_duelist_strong", "rri_duelist_weak", "rri_ranger_neutral"];
  const b = ["rri_duelist_strong", "rri_duelist_weak", "rri_ranger_strong", "rri_ranger_weak", "rri_ranger_neutral"];
  const comparisons = [];
  for (const profile of PROFILES) {
    const stateA = runSequence(a, profile, byId);
    const stateB = runSequence(b, profile, byId);
    for (const subjectId of suite.focalSubjects) {
      const beliefA = MODEL.retrieveImpressions(stateA, subjectId)[0];
      const beliefB = MODEL.retrieveImpressions(stateB, subjectId)[0];
      const ordersA = stateA.strengthObservations.filter((row) => row.subject.id === subjectId).map((row) => row.observationOrder);
      const ordersB = stateB.strengthObservations.filter((row) => row.subject.id === subjectId).map((row) => row.observationOrder);
      comparisons.push({
        profile,
        subjectId,
        ordersA,
        ordersB,
        weightedA: beliefA.weightedSemanticLevel,
        weightedB: beliefB.weightedSemanticLevel,
        equal: JSON.stringify(ordersA) === JSON.stringify(ordersB)
          && beliefA.weightedSemanticLevel === beliefB.weightedSemanticLevel,
      });
    }
  }
  return check("subject_local_primacy", comparisons.every((row) => row.equal) ? "pass" : "fail",
    "Moving an unchanged character-history later in the campaign must not weaken its first impression.", { comparisons });
}

function checkIdentityIsolation(suites) {
  const suite = suites.find((entry) => entry.id === "roster_replacement_identity");
  const byId = new Map(suite.reports.map((report) => [report.id, report]));
  const state = runSequence(suite.reports.map((report) => report.id), "expert", byId);
  const violations = [];
  for (const subjectId of suite.focalSubjects) {
    const presentReports = new Set(suite.reports.filter((report) => report.playerTeam.some((unit) => unit.id === subjectId)).map((report) => report.id));
    const observedReports = state.strengthObservations.filter((row) => row.subject.id === subjectId).map((row) => row.reportId);
    for (const reportId of observedReports) if (!presentReports.has(reportId)) violations.push({ subjectId, reportId });
  }
  return check("replacement_identity_isolation", violations.length === 0 ? "pass" : "fail",
    "Analogous replacement characters must never share observations or knowledge rows.", { violations });
}

function checkTraitIdentityIsolation(suites) {
  const suite = suites.find((entry) => entry.id === "roster_replacement_identity");
  const byId = new Map(suite.reports.map((report) => [report.id, report]));
  const state = runSequence(suite.reports.map((report) => report.id), "expert", byId);
  const violations = [];
  for (const subjectId of suite.focalSubjects) {
    const presentReports = new Set(suite.reports
      .filter((report) => report.playerTeam.some((unit) => unit.id === subjectId))
      .map((report) => report.id));
    const rows = state.knowledge.filter((row) => row.subject.id === subjectId);
    for (const row of rows) {
      for (const reportId of row.evidenceReportIds) {
        if (!presentReports.has(reportId)) violations.push({ subjectId, knowledgeId: row.id, kind: row.kind, reportId });
      }
    }
  }
  return check("replacement_knowledge_and_trait_isolation", violations.length === 0 ? "pass" : "fail",
    "All strength and trait knowledge evidence for replacement characters must remain inside that subject's own reports.", { violations });
}

function checkTraitOrderStability(suites) {
  const suite = suites.find((entry) => entry.id === "profile_trait_resolution");
  const byId = new Map(suite.reports.map((report) => [report.id, report]));
  const orders = permute(suite.reports.map((report) => report.id));
  const measurements = new Map();
  for (const profile of PROFILES) {
    for (const order of orders) {
      const state = runSequence(order, profile, byId);
      for (const subjectId of suite.focalSubjects) {
        const beliefs = MODEL.retrieveImpressions(state, subjectId)
          .filter((row) => row.kind === "trait" && row.relation === "synthesizes_trait_revalidation");
        for (const belief of beliefs) {
          const key = `${profile}|${subjectId}|${belief.claim.domain}`;
          if (!measurements.has(key)) measurements.set(key, []);
          measurements.get(key).push({ level: belief.claim.level, weighted: belief.weightedSemanticLevel });
        }
      }
    }
  }
  const rows = [...measurements.entries()].map(([key, values]) => {
    const [profile, subjectId, domain] = key.split("|");
    const levels = [...new Set(values.map((value) => value.level))].sort((a, b) => a - b);
    const weighted = values.map((value) => value.weighted);
    return {
      profile,
      subjectId,
      domain,
      permutationCount: values.length,
      levels,
      finalBandSpan: Math.max(...levels) - Math.min(...levels),
      weightedSpread: round(Math.max(...weighted) - Math.min(...weighted)),
    };
  });
  const maximumFinalBandSpan = Math.max(...rows.map((row) => row.finalBandSpan));
  return check("trait_order_stability", maximumFinalBandSpan <= 1 ? "pass" : "fail",
    "Trait revalidation may preserve finite order effects, but all 120 orders must finish within one shared semantic band per subject-domain.",
    { maximumFinalBandSpan, rows });
}

function checkCorrectionReachability(suites) {
  const suite = suites.find((entry) => entry.id === "contextual_correction");
  const byId = new Map(suite.reports.map((report) => [report.id, report]));
  const outcomes = [];
  for (const profile of PROFILES) {
    const state = MODEL.createImpressionState({ profile });
    const first = MODEL.analyzeBattleReport(byId.get("cc_weak_swarm"), { profile });
    MODEL.ingestBattleAnalysis(state, first);
    const initial = MODEL.retrieveImpressions(state, "hero_warrior")[0];
    for (const reportId of ["cc_mixed_patrol", "cc_armored_elite", "cc_armored_repeat", "cc_low_armor_champion"]) {
      MODEL.ingestBattleAnalysis(state, MODEL.analyzeBattleReport(byId.get(reportId), { profile }));
    }
    const final = MODEL.retrieveImpressions(state, "hero_warrior")[0];
    const armor = MODEL.retrieveImpressions(state, "hero_warrior", ["elite", "high_armor"])[0];
    outcomes.push({ profile, initial: initial.weightedSemanticLevel, final: final.weightedSemanticLevel, armor: armor.weightedSemanticLevel,
      corrected: final.weightedSemanticLevel < initial.weightedSemanticLevel && armor.claim.level < 0 });
  }
  return check("counterevidence_revises_belief", outcomes.every((row) => row.corrected) ? "pass" : "fail",
    "Repeated contradictory evidence must reduce the general belief while exact-context weakness remains retrievable.", { outcomes });
}

function checkFiniteOrderSensitivity(sequenceMatrix) {
  const rows = [];
  for (const [suiteId, suite] of Object.entries(sequenceMatrix)) {
    for (const [profile, subjects] of Object.entries(suite.profiles)) {
      for (const [subjectId, summary] of Object.entries(subjects)) {
        rows.push({ suiteId, profile, subjectId, spread: summary.spread, levels: summary.distinctFinalLevels });
      }
    }
  }
  const maximumSpread = Math.max(...rows.map((row) => row.spread));
  const maximumFinalBandSpan = Math.max(...rows.map((row) => Math.max(...row.levels) - Math.min(...row.levels)));
  const orderInvariant = rows.filter((row) => row.levels.length === 1 && row.spread === 0);
  const status = maximumFinalBandSpan <= 1 ? "pass" : "warn";
  return check("finite_order_sensitivity", status,
    "All 120 orders should show bounded primacy; order may move the final result by at most one shared semantic band in these mixed-evidence suites.",
    { maximumSpread, maximumFinalBandSpan, rows, orderInvariant });
}

function checkConstantOutputConfounding(reportMatrix, suites) {
  const reports = reportMatrix.team_relative_confounding.reports;
  const rows = Object.entries(reports).map(([reportId, profiles]) => {
    const unit = profiles.expert.units.find((entry) => entry.id === "hero_alchemist");
    return { reportId, usefulContribution: unit.usefulContribution, relativeStrengthPercent: unit.relativeStrengthPercent, level: unit.strength.level };
  });
  const usefulValues = new Set(rows.map((row) => row.usefulContribution));
  const rawValues = rows.map((row) => row.relativeStrengthPercent);
  const span = round(Math.max(...rawValues) - Math.min(...rawValues));
  const suite = suites.find((entry) => entry.id === "team_relative_confounding");
  const byId = new Map(suite.reports.map((report) => [report.id, report]));
  const state = runSequence(suite.reports.map((report) => report.id), "expert", byId);
  const focalObservations = state.strengthObservations.filter((row) => row.subject.id === "hero_alchemist");
  const evidenceRetainedForDecomposition = focalObservations.every((row) => row.basis
    && Number.isFinite(row.basis.subjectUsefulContribution)
    && Number.isFinite(row.basis.expectedUnitContribution)
    && Array.isArray(row.basis.teamContributions));
  const allyBands = [...new Set(focalObservations.map((row) => row.allyContext?.performanceBand))];
  const status = usefulValues.size === 1 && span >= 100 && evidenceRetainedForDecomposition
    && allyBands.includes("mostly_weak_teammates") && allyBands.includes("mostly_strong_teammates") ? "pass" : "fail";
  return check("team_relative_confounding", status,
    "The same 200 useful contribution must retain subject-visible teammate environment and decomposable team-performance evidence.",
    { span, evidenceRetainedForDecomposition, allyBands, rows });
}

function checkNegativeProfileBoundary(reportMatrix) {
  const negativeRows = [];
  for (const suite of Object.values(reportMatrix)) {
    for (const [reportId, profiles] of Object.entries(suite.reports)) {
      for (const ordinaryUnit of profiles.ordinary.units.filter((unit) => unit.relativeStrengthPercent < -25)) {
        const levels = Object.fromEntries(PROFILES.map((profile) => [profile,
          profiles[profile].units.find((unit) => unit.id === ordinaryUnit.id).strength.level]));
        negativeRows.push({ reportId, subjectId: ordinaryUnit.id, levels });
      }
    }
  }
  const allIdentical = negativeRows.every((row) => new Set(Object.values(row.levels)).size === 1);
  return check("negative_bands_are_profile_invariant", allIdentical ? "warn" : "fail",
    "Negative deterioration still uses one provisional scale for all three players and is not yet calibrated.", { sampleCount: negativeRows.length, allIdentical });
}

function checkTraitRevalidation(suites) {
  const suite = suites.find((entry) => entry.id === "profile_trait_resolution");
  const byId = new Map(suite.reports.map((report) => [report.id, report]));
  const state = MODEL.createImpressionState({ profile: "expert" });
  const firstTrace = MODEL.ingestBattleAnalysis(state,
    MODEL.analyzeBattleReport(byId.get("ptr_mage_65"), { profile: "expert" }));
  const before = MODEL.retrieveImpressions(state, "hero_mage")
    .find((row) => row.kind === "trait" && row.claim.domain === "area_damage" && row.relation === "synthesizes_trait_revalidation");
  const correctionTrace = MODEL.ingestBattleAnalysis(state,
    MODEL.analyzeBattleReport(byId.get("ptr_priest_65"), { profile: "expert" }));
  const afterGeneral = MODEL.retrieveImpressions(state, "hero_mage")
    .find((row) => row.kind === "trait" && row.claim.domain === "area_damage" && row.relation === "synthesizes_trait_revalidation");
  const afterContext = MODEL.retrieveImpressions(state, "hero_mage", ["boss", "magic_pressure"])
    .find((row) => row.kind === "trait" && row.claim.domain === "area_damage"
      && row.relation === "synthesizes_exact_context_trait_revalidation");
  const observationCountBeforeNoAttempt = afterGeneral?.observationCount;
  const noAttemptTrace = MODEL.ingestBattleAnalysis(state,
    MODEL.analyzeBattleReport(byId.get("ptr_guardian_65"), { profile: "expert" }));
  const afterNoAttempt = MODEL.retrieveImpressions(state, "hero_mage")
    .find((row) => row.kind === "trait" && row.claim.domain === "area_damage" && row.relation === "synthesizes_trait_revalidation");
  const contextFallbackAfterNoAttempt = MODEL.retrieveImpressions(state, "hero_mage", ["elite", "ranged_pressure"])
    .find((row) => row.kind === "trait" && row.claim.domain === "area_damage" && row.relation === "synthesizes_trait_revalidation");
  const corrected = before?.claim.currentSalient === true
    && afterGeneral?.claim.currentSalient === false
    && afterContext?.claim.level === 0
    && correctionTrace.changes.some((change) => change.action === "added_trait_context_correction" && change.domain === "area_damage")
    && noAttemptTrace.changes.some((change) => change.action === "trait_review_inconclusive_no_attempt" && change.domain === "area_damage")
    && afterNoAttempt?.observationCount === observationCountBeforeNoAttempt
    && contextFallbackAfterNoAttempt?.claim.level === afterNoAttempt?.claim.level;
  return check("trait_battle_revalidation", corrected ? "pass" : "fail",
    "Existing trait cognition must be reviewed every battle: a clear weak attempt creates an environmental correction, while no attempt leaves belief unchanged.",
    {
      firstTraceReviewed: firstTrace.changes.some((change) => change.action === "reviewed_existing_impressions"),
      before: before && { level: before.claim.level, currentSalient: before.claim.currentSalient, observationCount: before.observationCount },
      afterGeneral: afterGeneral && { level: afterGeneral.claim.level, currentSalient: afterGeneral.claim.currentSalient, observationCount: afterGeneral.observationCount },
      afterContext: afterContext && { level: afterContext.claim.level, currentSalient: afterContext.claim.currentSalient },
      noAttemptObservationCount: afterNoAttempt?.observationCount,
      noAttemptContextFallback: contextFallbackAfterNoAttempt && {
        level: contextFallbackAfterNoAttempt.claim.level,
        relation: contextFallbackAfterNoAttempt.relation,
      },
      correctionActions: correctionTrace.changes.filter((change) => change.domain === "area_damage"),
      noAttemptActions: noAttemptTrace.changes.filter((change) => change.domain === "area_damage"),
    });
}

function checkSimultaneousStrengthMatrix() {
  const matrix = MODEL.STRENGTH_MATRIX.createStrengthCognitionMatrix({ profile: "expert" });
  matrix.entries = [
    seededMatrixEntry("matrix_a", 3),
    seededMatrixEntry("matrix_b", 6),
    seededMatrixEntry("matrix_c", 12),
    seededMatrixEntry("matrix_d", 9),
  ];
  MODEL.STRENGTH_MATRIX.refreshStrengthScale(matrix);
  const result = MODEL.STRENGTH_MATRIX.updateStrengthCognitionMatrix(matrix, {
    reportId: "simultaneous_matrix_probe",
    profile: "expert",
    units: [
      matrixObservedUnit("matrix_a", 0),
      matrixObservedUnit("matrix_b", 2),
      matrixObservedUnit("matrix_c", 6),
      matrixObservedUnit("matrix_d", 6),
    ],
  });
  const positions = Object.fromEntries(result.matrix.entries.map((entry) => [entry.subject.id, entry.position]));
  const pass = positions.matrix_a > 3 && Math.abs(positions.matrix_b - 6) < 0.2
    && positions.matrix_c < 12 && positions.matrix_d > 9;
  return check("simultaneous_strength_matrix", pass ? "pass" : "fail",
    "One battle must solve all four character positions simultaneously instead of updating them in sequence.", {
      before: { matrix_a: 3, matrix_b: 6, matrix_c: 12, matrix_d: 9 },
      after: positions,
      relativeMatrix: result.trace.battleRelativeMatrix,
    });
}

function checkTopThirtyScaleRecalibration() {
  const baseline = MODEL.STRENGTH_MATRIX.createStrengthCognitionMatrix({ profile: "expert" });
  const scores = [12, 10, 9, 8, 7, 6, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, -1, -2, -3];
  baseline.entries = scores.map((position, index) => seededMatrixEntry(`scale_${index + 1}`, position));
  MODEL.STRENGTH_MATRIX.refreshStrengthScale(baseline);
  const strong = structuredClone(baseline);
  strong.entries.push(seededMatrixEntry("scale_strong_1", 15), seededMatrixEntry("scale_strong_2", 14), seededMatrixEntry("scale_strong_3", 13));
  MODEL.STRENGTH_MATRIX.refreshStrengthScale(strong);
  const weak = structuredClone(baseline);
  for (let index = 0; index < 10; index += 1) weak.entries.push(seededMatrixEntry(`scale_weak_${index + 1}`, -10 - index));
  MODEL.STRENGTH_MATRIX.refreshStrengthScale(weak);
  const baseEntry = baseline.entries.find((entry) => entry.subject.id === "scale_3");
  const strongEntry = strong.entries.find((entry) => entry.subject.id === "scale_3");
  const weakEntry = weak.entries.find((entry) => entry.subject.id === "scale_3");
  const pass = baseline.scale.boundaryPosition === 6
    && baseline.entries.find((entry) => entry.subject.id === "scale_5").scaleView.level === 1
    && strong.scale.boundaryPosition > baseline.scale.boundaryPosition
    && strongEntry.scaleView.level < baseEntry.scaleView.level
    && weak.scale.boundaryPosition < baseline.scale.boundaryPosition
    && weakEntry.scaleView.level > baseEntry.scaleView.level;
  return check("top_thirty_scale_recalibration", pass ? "pass" : "fail",
    "The weakest member of the live top 30% is zero: several strong arrivals lower old labels, while many valid weak arrivals raise them.", {
      baseline: { scale: baseline.scale, oldSubjectLevel: baseEntry.scaleView.level },
      afterStrong: { scale: strong.scale, oldSubjectLevel: strongEntry.scaleView.level },
      afterWeak: { scale: weak.scale, oldSubjectLevel: weakEntry.scaleView.level },
    });
}

function seededMatrixEntry(id, position) {
  return {
    subject: { id, name: id, role: "probe" },
    position,
    stiffness: 1,
    evidenceCount: 1,
    firstObservedReportId: "seed",
    lastObservedReportId: "seed",
    lastObservedLevel: position,
    scaleView: null,
  };
}

function matrixObservedUnit(id, level) {
  return { id, name: id, role: "probe", strength: { level } };
}

function runSequence(order, profile, reportById) {
  const state = MODEL.createImpressionState({ profile });
  for (const reportId of order) {
    const analysis = MODEL.analyzeBattleReport(reportById.get(reportId), { profile });
    MODEL.ingestBattleAnalysis(state, analysis);
  }
  return state;
}

function permute(values) {
  if (values.length <= 1) return [values.slice()];
  const result = [];
  for (let index = 0; index < values.length; index += 1) {
    const head = values[index];
    const tail = values.slice(0, index).concat(values.slice(index + 1));
    for (const suffix of permute(tail)) result.push([head, ...suffix]);
  }
  return result;
}

function check(id, status, statement, evidence) {
  return { id, status, statement, evidence };
}

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function summarize(result) {
  return {
    verdict: result.verdict,
    execution: result.execution,
    checks: result.checks.map((checkRow) => ({ id: checkRow.id, status: checkRow.status, evidence: checkRow.evidence })),
  };
}

if (require.main === module) {
  const result = buildSystematicResult();
  if (process.argv.includes("--write")) {
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
  }
  console.log(JSON.stringify(summarize(result), null, 2));
  if (result.verdict === "revise") process.exitCode = 1;
}

module.exports = { PROFILES, buildSystematicResult, runSequence, permute };
