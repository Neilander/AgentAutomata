const { freezeStructuredInput } = require("./structured-case-contract-v1");

const FROZEN_AT = "2026-07-21T04:00:00.000Z";

function source(caseId, kind, title, sourceGroup, locator, preEmotionFacts) {
  return {
    schema: "structured_emotion_source_v1",
    caseId,
    kind,
    title,
    sourceGroup,
    locator,
    preEmotionFacts,
  };
}

function input(caseId, sourceFactIds, profile, history, events) {
  return freezeStructuredInput({
    schema: "structured_emotion_input_v1",
    caseId,
    split: "discovery",
    sourceFactIds,
    annotation: {
      inputAnnotator: "root-discovery",
      frozenAt: FROZEN_AT,
      goldVisibleDuringEncoding: true,
      limitation: "The developer had already inspected the answer; this case may find model errors but cannot count as blind accuracy.",
    },
    profile,
    history,
    events,
  });
}

function gold(caseId, goldLocator, emotions) {
  return {
    schema: "structured_emotion_gold_v1",
    caseId,
    emotions: emotions.map((emotion) => ({
      ...emotion,
      intensityKnown: false,
    })),
    evidenceType: "author_explicit",
    goldLocator,
    annotation: {
      goldAnnotator: "root-discovery",
      revealedAt: "2026-07-21T03:00:00.000Z",
      blindEligible: false,
    },
  };
}

const cases = [
  {
    source: source(
      "dickens-scrooge-bells",
      "literature",
      "A Christmas Carol",
      "a-christmas-carol",
      "https://www.gutenberg.org/files/46/46-h/46-h.htm",
      [
        {
          id: "face",
          statement: "Scrooge sees the face of his partner, dead for seven years, appear in a familiar door knocker.",
          locator: "Stave I, lines 258-265",
        },
        {
          id: "bells",
          statement: "A disused bell begins moving by itself; every bell rings and a chain-like noise approaches his locked room.",
          locator: "Stave I, lines 276-283",
        },
        {
          id: "isolation",
          statement: "He is alone at night inside dark rooms and does not know the source or capability of the approaching event.",
          locator: "Stave I, lines 255-281",
        },
      ],
    ),
    input: input(
      "dickens-scrooge-bells",
      ["face", "bells", "isolation"],
      {
        goalValues: { safety: 0.9 },
        domainSelfEfficacy: { supernaturalThreat: 0.15 },
        riskTolerance: 0.45,
        uncertaintyTolerance: 0.35,
        emotionDynamics: {
          domainSelfEfficacy: 0.15,
          riskTolerance: 0.45,
        },
      },
      {},
      [{
        id: "approaching-unknown",
        time: 0,
        domain: "supernaturalThreat",
        difficulty: 0.9,
        stakes: [{
          targetId: "personalSafety",
          valueKey: "safety",
          magnitude: 0.8,
          probability: 0.65,
          direction: "negative",
          timeToImpactSeconds: 5,
          immediacyHorizonSeconds: 30,
          confidence: 0.65,
        }],
        options: [{
          id: "locked-door",
          type: "escape",
          availability: 0.25,
          known: 0.5,
          expectedEffectiveness: 0.25,
          cost: 0.1,
          confidence: 0.45,
        }],
        outcome: {
          expectedUncertainty: 0.95,
          confidence: 0.75,
        },
        epistemic: {
          expectationViolation: 0.95,
          requiredInformationMissing: 0.92,
          familiarity: 0.02,
          informationGain: 0.15,
          confidence: 0.8,
        },
        targets: {
          threatSource: "unexplained approaching presence",
          informationObject: "source of bells and chains",
        },
      }],
    ),
    gold: gold(
      "dickens-scrooge-bells",
      "Stave I, lines 264 and 276-283",
      [
        { family: "fear", timepoint: "onset" },
        { family: "anxiety", timepoint: "onset" },
        { family: "surprise", timepoint: "onset" },
      ],
    ),
  },
  {
    source: source(
      "austen-elizabeth-self-discovery",
      "literature",
      "Pride and Prejudice",
      "pride-and-prejudice",
      "https://www.gutenberg.org/files/1342/1342-h/1342-h.htm",
      [
        {
          id: "new-evidence",
          statement: "Darcy's letter supplies evidence that contradicts Elizabeth's earlier judgments of Darcy and Wickham.",
          locator: "Chapter XXXVI, lines 2340-2353",
        },
        {
          id: "self-cause",
          statement: "Elizabeth concludes that her own vanity, partiality and prejudice caused her unjust judgment.",
          locator: "Chapter XXXVI, lines 2353-2355",
        },
        {
          id: "private",
          statement: "The realization occurs while Elizabeth is alone reading and reviewing the letter.",
          locator: "Chapter XXXVI",
        },
      ],
    ),
    input: input(
      "austen-elizabeth-self-discovery",
      ["new-evidence", "self-cause", "private"],
      {
        normSensitivity: 0.8,
        socialEvaluationSensitivity: 0.55,
        goalValues: { discernment: 0.95, fairness: 0.85 },
      },
      {},
      [{
        id: "belief-reversal",
        time: 0,
        outcome: {
          actualUtility: -0.7,
          selfEvaluationChange: -0.95,
          bestForeseeableAlternativeUtility: 0.35,
          alternativeForeseeability: 0.8,
          confidence: 0.9,
        },
        epistemic: {
          expectationViolation: 0.9,
          requiredInformationMissing: 0.45,
          familiarity: 0.2,
          informationGain: 0.9,
          confidence: 0.9,
        },
        agency: {
          actorIsSelf: true,
          causalContribution: 0.9,
          intentionality: 0.2,
          evidenceConfidence: 0.9,
        },
        social: {
          normSeverity: 0.72,
          audienceExposure: 0.05,
          harmToOther: 0.45,
          confidence: 0.8,
        },
        targets: {
          harmedOther: "Darcy",
          rejectedAlternative: "fairer interpretation of Darcy and Wickham",
        },
      }],
    ),
    gold: gold(
      "austen-elizabeth-self-discovery",
      "Chapter XXXVI, lines 2353-2355",
      [
        { family: "shame", timepoint: "settled" },
      ],
    ),
  },
  {
    source: source(
      "austen-elizabeth-lakes-cancelled",
      "literature",
      "Pride and Prejudice",
      "pride-and-prejudice",
      "https://www.gutenberg.org/files/1342/1342-h/1342-h.htm",
      [
        {
          id: "valued-plan",
          statement: "Elizabeth had set her heart on a planned tour of the Lakes.",
          locator: "Chapter XLII, lines 2650-2652",
        },
        {
          id: "plan-reduced",
          statement: "Business and time constraints force the party to replace the Lakes with a shorter Derbyshire tour.",
          locator: "Chapter XLII, lines 2650-2652",
        },
        {
          id: "alternative-remains",
          statement: "A smaller but still enjoyable trip with compatible companions remains available.",
          locator: "Chapter XLII, lines 2652-2656",
        },
      ],
    ),
    input: input(
      "austen-elizabeth-lakes-cancelled",
      ["valued-plan", "plan-reduced", "alternative-remains"],
      {
        goalValues: { lakesTrip: 0.9, travelEnjoyment: 0.75 },
        counterfactualSensitivity: 0.6,
      },
      {},
      [{
        id: "trip-substitution",
        time: 0,
        outcome: {
          actualUtility: 0.15,
          expectedUtility: 0.75,
          expectationConfidence: 0.9,
          goalProgress: -0.7,
          positiveProspect: 0.55,
          bestForeseeableAlternativeUtility: 0.75,
          alternativeForeseeability: 1,
          confidence: 0.9,
        },
        targets: {
          expectedOutcome: "tour of the Lakes",
          anticipatedOutcome: "shorter Derbyshire tour",
        },
      }],
    ),
    gold: gold(
      "austen-elizabeth-lakes-cancelled",
      "Chapter XLII, line 2652",
      [{ family: "disappointment", timepoint: "settled" }],
    ),
  },
  {
    source: source(
      "austen-elizabeth-darcy-kindness",
      "literature",
      "Pride and Prejudice",
      "pride-and-prejudice",
      "https://www.gutenberg.org/files/1342/1342-h/1342-h.htm",
      [
        {
          id: "negative-expectation",
          statement: "Elizabeth had expected Darcy to avoid her after she rejected him and accused him unjustly.",
          locator: "Chapter XLIV, lines 2845-2849",
        },
        {
          id: "kind-actions",
          statement: "Darcy instead preserves the acquaintance, seeks her friends' good opinion and introduces her to his sister.",
          locator: "Chapter XLIV, lines 2847-2849",
        },
        {
          id: "intentional-benefit",
          statement: "The conduct is deliberate, socially beneficial to Elizabeth and costly in light of the earlier rejection.",
          locator: "Chapter XLIV, lines 2847-2850",
        },
      ],
    ),
    input: input(
      "austen-elizabeth-darcy-kindness",
      ["negative-expectation", "kind-actions", "intentional-benefit"],
      {
        relationshipValues: { darcy: 0.72 },
        goalValues: { socialAcceptance: 0.75 },
      },
      {},
      [{
        id: "unexpected-kindness",
        time: 0,
        outcome: {
          actualUtility: 0.8,
          expectedUtility: -0.45,
          expectationConfidence: 0.8,
          goalProgress: 0.65,
          rewardConsumed: 0.7,
          relationshipChange: 0.75,
          confidence: 0.85,
        },
        agency: {
          actorIsSelf: false,
          causalContribution: 0.9,
          intentionality: 0.95,
          evidenceConfidence: 0.85,
        },
        social: {
          relationshipId: "darcy",
          benefitFromOther: 0.9,
          attachmentRelevance: 0.65,
          safetyChange: 0.65,
          confidence: 0.85,
        },
        targets: {
          benefactor: "Darcy",
          socialObject: "Darcy",
          rewardSource: "Darcy's considerate conduct",
        },
      }],
    ),
    gold: gold(
      "austen-elizabeth-darcy-kindness",
      "Chapter XLIV, lines 2847-2850",
      [
        { family: "gratitude", timepoint: "settled" },
        { family: "surprise", timepoint: "onset" },
      ],
    ),
  },
  {
    source: source(
      "nasa-tan-first-major-hardware",
      "interview",
      "Florence Tan — To Know Her Family Is to Know Her",
      "florence-tan-interview",
      "https://www.nasa.gov/people-of-nasa/florence-tan-to-know-her-family-is-to-know-her/",
      [
        {
          id: "young-lead",
          statement: "In her twenties, Tan was responsible for command/data handling and memory boards on major Cassini instruments.",
          locator: "lines 336-341",
        },
        {
          id: "high-stakes",
          statement: "One probe would travel seven years and then have only about sixty minutes to operate, with no second chance.",
          locator: "lines 341-343",
        },
        {
          id: "knowledge-gap",
          statement: "At the beginning she did not know enough and had to learn, test and simulate failure modes.",
          locator: "lines 340-346",
        },
      ],
    ),
    input: input(
      "nasa-tan-first-major-hardware",
      ["young-lead", "high-stakes", "knowledge-gap"],
      {
        goalValues: { missionSuccess: 1, professionalCompetence: 0.9 },
        domainSelfEfficacy: { spacecraftHardware: 0.3 },
        riskTolerance: 0.35,
        uncertaintyTolerance: 0.35,
        emotionDynamics: {
          domainSelfEfficacy: 0.3,
          riskTolerance: 0.35,
        },
      },
      {},
      [{
        id: "high-stakes-responsibility",
        time: 0,
        domain: "spacecraftHardware",
        difficulty: 0.92,
        stakes: [
          {
            targetId: "mission",
            valueKey: "missionSuccess",
            magnitude: 1,
            probability: 0.55,
            direction: "negative",
            timeToImpactSeconds: 31_536_000,
            immediacyHorizonSeconds: 31_536_000,
            confidence: 0.75,
          },
          {
            targetId: "competence",
            valueKey: "professionalCompetence",
            magnitude: 0.8,
            probability: 0.65,
            direction: "negative",
            timeToImpactSeconds: 2_592_000,
            immediacyHorizonSeconds: 7_776_000,
            confidence: 0.7,
          },
        ],
        options: [
          {
            id: "test",
            type: "information",
            availability: 0.9,
            known: 0.5,
            expectedEffectiveness: 0.7,
            cost: 0.55,
            confidence: 0.6,
          },
          {
            id: "learn-from-team",
            type: "information",
            availability: 0.8,
            known: 0.55,
            expectedEffectiveness: 0.75,
            cost: 0.4,
            confidence: 0.65,
          },
        ],
        outcome: {
          expectedUncertainty: 0.9,
          positiveProspect: 0.55,
          confidence: 0.75,
        },
        epistemic: {
          requiredInformationMissing: 0.78,
          familiarity: 0.15,
          informationGain: 0.4,
          confidence: 0.75,
        },
        targets: {
          threatSource: "mission hardware responsibility",
          informationObject: "ways the hardware and software could fail",
        },
      }],
    ),
    gold: {
      ...gold(
        "nasa-tan-first-major-hardware",
        "lines 340-346",
        [
          { family: "fear", timepoint: "onset" },
          { family: "anxiety", timepoint: "settled" },
        ],
      ),
      evidenceType: "first_person_self_report",
    },
  },
  {
    source: source(
      "maluendas-family-contact",
      "documentary",
      "Brazilian 9/11 Survivor Inspired to Tell Story",
      "adriana-maluendas-account",
      "https://www.911memorial.org/connect/blog/brazilian-911-survivor-inspired-tell-story",
      [
        {
          id: "escape",
          statement: "Maluendas escaped the World Trade Center site as the North Tower fell and walked uptown for hours without a clear destination.",
          locator: "lines 109-111",
        },
        {
          id: "family-uncertain",
          statement: "Her family did not know where she was and called hotels listed on a copy of her itinerary.",
          locator: "line 111",
        },
        {
          id: "contact-found",
          statement: "After checking into an alternate hotel, she learned that her family had already called that hotel hoping to find her.",
          locator: "line 111",
        },
      ],
    ),
    input: input(
      "maluendas-family-contact",
      ["escape", "family-uncertain", "contact-found"],
      {
        goalValues: { survival: 1, familyContact: 0.9 },
        relationshipValues: { family: 1 },
        domainSelfEfficacy: { disasterEscape: 0.25 },
        riskTolerance: 0.2,
        emotionDynamics: {
          domainSelfEfficacy: 0.25,
          riskTolerance: 0.2,
          relationshipSecurity: 0.7,
        },
      },
      {
        chronicStress: 0.75,
        memories: [{
          id: "tower-collapse",
          category: "threat",
          domain: "disasterEscape",
          strength: 1,
          recency: 1,
          count: 1,
          resolved: false,
        }],
      },
      [
        {
          id: "escape-without-destination",
          time: 0,
          domain: "disasterEscape",
          difficulty: 0.95,
          stakes: [{
            targetId: "survival",
            valueKey: "survival",
            magnitude: 1,
            probability: 0.9,
            direction: "negative",
            timeToImpactSeconds: 0,
            confidence: 0.95,
          }],
          options: [{
            id: "walk-uptown",
            type: "escape",
            availability: 0.75,
            known: 0.35,
            expectedEffectiveness: 0.5,
            cost: 0.7,
            confidence: 0.5,
          }],
          outcome: {
            actualUtility: -0.7,
            expectedUtility: 0.5,
            expectationConfidence: 0.95,
            expectedUncertainty: 1,
            goalProgress: -0.5,
            confidence: 0.9,
          },
          targets: { threatSource: "collapsing World Trade Center site" },
        },
        {
          id: "family-contact-discovered",
          time: 18_000,
          domain: "disasterEscape",
          difficulty: 0.15,
          outcome: {
            actualUtility: 0.9,
            expectedUtility: -0.35,
            expectationConfidence: 0.75,
            expectedUncertainty: 0.7,
            goalProgress: 0.85,
            rewardConsumed: 0.8,
            threatRemovedFraction: 0.9,
            relationshipChange: 0.55,
            confidence: 0.9,
          },
          agency: {
            actorIsSelf: false,
            causalContribution: 0.8,
            intentionality: 1,
            evidenceConfidence: 0.9,
          },
          social: {
            relationshipId: "family",
            benefitFromOther: 0.75,
            attachmentRelevance: 0.95,
            safetyChange: 0.9,
            confidence: 0.9,
          },
          targets: {
            resolvedThreat: "family not knowing whether she survived",
            benefactor: "family",
            rewardSource: "discovered route to family contact",
          },
        },
      ],
    ),
    gold: {
      ...gold(
        "maluendas-family-contact",
        "line 111",
        [
          { family: "surprise", timepoint: "onset", eventId: "family-contact-discovered" },
          { family: "relief", timepoint: "onset", eventId: "family-contact-discovered" },
        ],
      ),
      evidenceType: "contemporaneous_behavior",
    },
  },
  {
    source: source(
      "shelley-frankenstein-remorse",
      "literature",
      "Frankenstein; or, The Modern Prometheus",
      "frankenstein",
      "https://www.gutenberg.org/cache/epub/42324/pg42324-images.html",
      [
        {
          id: "creation-cause",
          statement: "Victor created and released the being that killed people he loved.",
          locator: "Chapter VIII-IX, lines 682-689",
        },
        {
          id: "irreversible-deaths",
          statement: "William and Justine are dead and cannot be restored.",
          locator: "Chapter VIII-IX, lines 682-687",
        },
        {
          id: "foreseeable-restraint",
          statement: "Victor judges that his own earlier choices caused the harm and that restraint would have avoided it.",
          locator: "Chapter IX, lines 687-698",
        },
        {
          id: "future-risk",
          statement: "The created being remains capable of causing further harm to Victor's surviving loved ones.",
          locator: "Chapter IX, lines 697-699",
        },
      ],
    ),
    input: input(
      "shelley-frankenstein-remorse",
      ["creation-cause", "irreversible-deaths", "foreseeable-restraint", "future-risk"],
      {
        goalValues: { lovedOnes: 1, benevolence: 0.9 },
        relationshipValues: { family: 1 },
        normSensitivity: 0.9,
        counterfactualSensitivity: 0.85,
      },
      {
        unresolvedLoss: 1,
        memories: [{
          id: "deaths",
          category: "loss",
          strength: 1,
          recency: 0.95,
          resolved: false,
        }],
      },
      [{
        id: "recognizes-caused-deaths",
        time: 0,
        domain: "moralResponsibility",
        difficulty: 0.95,
        stakes: [
          {
            targetId: "lovedOnes",
            valueKey: "lovedOnes",
            magnitude: 1,
            probability: 1,
            direction: "negative",
            realizedFraction: 1,
            irreversibility: 1,
            timeToImpactSeconds: 0,
            confidence: 1,
          },
          {
            targetId: "survivingFamily",
            valueKey: "lovedOnes",
            magnitude: 0.95,
            probability: 0.75,
            direction: "negative",
            realizedFraction: 0,
            timeToImpactSeconds: 86_400,
            immediacyHorizonSeconds: 604_800,
            confidence: 0.8,
          },
        ],
        outcome: {
          actualUtility: -1,
          expectedUtility: 0.45,
          expectationConfidence: 0.85,
          goalProgress: -1,
          selfEvaluationChange: -0.95,
          bestForeseeableAlternativeUtility: 0.7,
          alternativeForeseeability: 0.85,
          confidence: 0.95,
        },
        agency: {
          actorIsSelf: true,
          causalContribution: 0.9,
          intentionality: 0.05,
          evidenceConfidence: 0.9,
        },
        social: {
          relationshipId: "family",
          normSeverity: 0.95,
          harmToOther: 1,
          attachmentRelevance: 1,
          audienceExposure: 0.15,
          confidence: 0.95,
        },
        targets: {
          harmedOther: "William, Justine and surviving family",
          lossObject: "William and Justine",
          rejectedAlternative: "not creating and abandoning the dangerous being",
          threatSource: "the created being",
        },
      }],
    ),
    gold: gold(
      "shelley-frankenstein-remorse",
      "Chapter IX, lines 687-693",
      [
        { family: "guilt", timepoint: "settled" },
        { family: "regret", timepoint: "settled" },
        { family: "sadness", timepoint: "settled" },
        { family: "fear", timepoint: "settled" },
      ],
    ),
  },
  {
    source: source(
      "doyle-copper-beeches-curiosity",
      "literature",
      "The Adventures of Sherlock Holmes — The Copper Beeches",
      "adventures-of-sherlock-holmes",
      "https://www.gutenberg.org/files/1661/1661-h/1661-h.htm",
      [
        {
          id: "forbidden-room",
          statement: "A suite of rooms is kept shut, one window is shuttered, and the employer gives an evasive explanation.",
          locator: "The Copper Beeches, lines 4326-4327 and preceding account",
        },
        {
          id: "inspect-opportunity",
          statement: "A key is accidentally left in the door while the household is elsewhere, creating an opportunity to inspect.",
          locator: "The Copper Beeches, account immediately before lines 4326-4327",
        },
        {
          id: "possible-help",
          statement: "Violet believes that discovering what is hidden may help someone.",
          locator: "The Copper Beeches, paragraph beginning 'It was not mere curiosity'",
        },
      ],
    ),
    input: input(
      "doyle-copper-beeches-curiosity",
      ["forbidden-room", "inspect-opportunity", "possible-help"],
      {
        goalValues: { discoverTruth: 0.85, helpOther: 0.75, personalSafety: 0.8 },
        domainSelfEfficacy: { investigation: 0.72 },
        uncertaintyTolerance: 0.65,
        emotionDynamics: {
          domainSelfEfficacy: 0.72,
          riskTolerance: 0.55,
        },
      },
      {},
      [{
        id: "opportunity-to-inspect",
        time: 0,
        domain: "investigation",
        difficulty: 0.35,
        stakes: [{
          targetId: "personalSafety",
          valueKey: "personalSafety",
          magnitude: 0.45,
          probability: 0.25,
          direction: "negative",
          timeToImpactSeconds: 120,
          immediacyHorizonSeconds: 300,
          confidence: 0.55,
        }],
        options: [{
          id: "quiet-inspection",
          type: "information",
          availability: 0.95,
          known: 0.9,
          expectedEffectiveness: 0.85,
          cost: 0.25,
          confidence: 0.8,
        }],
        outcome: {
          expectedUncertainty: 0.75,
          positiveProspect: 0.65,
          confidence: 0.7,
        },
        epistemic: {
          expectationViolation: 0.6,
          requiredInformationMissing: 0.9,
          familiarity: 0.1,
          informationGain: 0.85,
          confidence: 0.8,
        },
        targets: {
          informationObject: "purpose of the forbidden rooms",
          anticipatedOutcome: "discover information that may help someone",
        },
      }],
    ),
    gold: gold(
      "doyle-copper-beeches-curiosity",
      "The Copper Beeches, paragraph beginning 'It was not mere curiosity'",
      [{ family: "curiosity", timepoint: "settled" }],
    ),
  },
  {
    source: source(
      "nasa-yuknis-mission-console",
      "interview",
      "William Yuknis — Branch Head, Engineer, and Role Model",
      "william-yuknis-interview",
      "https://www.nasa.gov/centers-and-facilities/goddard/william-yuknis-branch-head-engineer-and-role-model/",
      [
        {
          id: "first-deaf-console",
          statement: "Yuknis became the first deaf NASA engineer to sit at a mission-operations console.",
          locator: "lines 295-297",
        },
        {
          id: "lunar-responsibility",
          statement: "He supported the Lunar Reconnaissance Orbiter from launch to lunar orbit after designing a key command/data unit.",
          locator: "lines 295-299",
        },
        {
          id: "working-result",
          statement: "The mission hardware worked and remained operational years later.",
          locator: "lines 297-300",
        },
      ],
    ),
    input: input(
      "nasa-yuknis-mission-console",
      ["first-deaf-console", "lunar-responsibility", "working-result"],
      {
        goalValues: { missionSuccess: 1, engineeringCompetence: 0.95, representation: 0.8 },
        domainSelfEfficacy: { missionOperations: 0.82 },
        socialEvaluationSensitivity: 0.65,
      },
      {},
      [{
        id: "mission-reaches-lunar-orbit",
        time: 0,
        domain: "missionOperations",
        outcome: {
          actualUtility: 1,
          expectedUtility: 0.55,
          expectationConfidence: 0.85,
          goalProgress: 1,
          rewardConsumed: 0.9,
          selfEvaluationChange: 0.95,
          confidence: 0.95,
        },
        agency: {
          actorIsSelf: true,
          causalContribution: 0.82,
          intentionality: 1,
          evidenceConfidence: 0.95,
        },
        social: {
          audienceExposure: 0.7,
          statusDamage: 0,
          confidence: 0.8,
        },
        targets: {
          rewardSource: "successful mission contribution",
          goalObject: "Lunar Reconnaissance Orbiter reaching lunar orbit",
        },
      }],
    ),
    gold: {
      ...gold(
        "nasa-yuknis-mission-console",
        "lines 295-299",
        [{ family: "pride", timepoint: "settled" }],
      ),
      evidenceType: "first_person_self_report",
    },
  },
];

module.exports = {
  cases,
};
