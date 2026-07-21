const {
  projectEmotionsAtHorizon,
  simulateEmotionSequence,
} = require("./emotion-simulator-v1");

const RULES = Object.freeze({
  threatMagnitude: [
    /\battack|\bassault|\bthreat|\bdanger|\bweapon|\bgun|\bknife|\baccident|\bcrash|\bfire\b|\bwar\b|\bviolence/i,
    /\billness|\bdisease|\bhospital|\boperation|\bseriously ill|\bdeath|\bdied|\bdying/i,
  ],
  threatImmediacy: [
    /\bsudden|\bsuddenly|\bimmediate|\bnearby|\bin front of me|\bchased|\bgrabbed|\bhit me|\bstruck me/i,
    /\battack|\bassault|\baccident|\bcrash|\bexplosion|\bweapon|\bgun|\bknife/i,
  ],
  lowControl: [
    /\bcould not|\bcouldn't|\bunable|\bhelpless|\bno way|\bnothing I could|\bpowerless|\bimpossible/i,
    /\bwas forced|\bhad to\b|\bwithout being able|\btoo late/i,
  ],
  highControl: [
    /\bmanaged to|\bsucceeded|\bsolved|\bpassed|\bwon\b|\bcompleted|\bfinished|\bescaped|\bprotected/i,
  ],
  obstruction: [
    /\bprevented|\bblocked|\brefused|\bdenied|\bfailed|\bfailure|\bunable|\bcould not|\bcouldn't/i,
    /\binterrupted|\bdelayed|\bmissed|\blost the chance|\bnot allowed|\bwrong result|\bkept me from/i,
  ],
  blame: [
    /\bunfair|\bunjust|\bcheat|\bbetray|\blied|\blie to|\binsult|\bmock|\brude|\bcruel|\babuse/i,
    /\bpunish|\bblamed me|\btreated me|\bdeceived|\bstole|\bstolen|\bdeliberately|\bon purpose/i,
  ],
  positiveOutcome: [
    /\bpassed|\bwon\b|\bsucceeded|\bachieved|\baccepted|\bpromoted|\bgraduat|\bbirth|\bborn\b/i,
    /\brecovered|\breturned|\breunion|\bmarried|\bengaged|\breceived|\bfound\b|\bgot the job/i,
  ],
  rewardConsumption: [
    /\bcelebrat|\btogether|\breunion|\bmarried|\bengaged|\bbirth|\bholiday|\bgift|\bparty\b/i,
    /\bpassed|\bwon\b|\bsucceeded|\bachieved|\baccepted|\bpromoted|\bgraduat|\brecovered/i,
  ],
  negativeOutcome: [
    /\bfailed|\brejected|\brefused|\blost\b|\bmissed|\bdied|\bdeath|\bbroke up|\bdivorce/i,
    /\bnot pass|\bnot accepted|\bfired|\bdismissed|\bdefeated|\bcancelled|\bdestroyed/i,
  ],
  uncertainty: [
    /\bwaiting|\bwaited|\buncertain|\bnot know|\bdidn't know|\bwhether|\bmaybe|\bresult|\bexam/i,
    /\bdiagnos|\btest result|\bdecision was pending|\bno information/i,
  ],
  unexpectedChange: [
    /\bsudden|\bsuddenly|\bunexpected|\bwithout warning|\bfor the first time|\bturned out|\bdiscovered/i,
  ],
  socialSafety: [
    /\bhelped me|\bsaved me|\bsupported me|\bcomforted|\bwelcomed|\bforgave|\btrusted me|\bstood by me/i,
  ],
  socialDanger: [
    /\bbetray|\babandon|\breject|\bexclude|\bignored me|\blaughed at|\bmock|\bhumiliat|\binsult/i,
  ],
  statusChallenge: [
    /\binsult|\bmock|\blaughed at|\bhumiliat|\blooked down|\btreated me like|\bcompared me/i,
  ],
  selfAttribution: [
    /\bmy fault|\bbecause of me|\bI had done|\bI did\b|\bI caused|\bmy mistake|\bI lied|\bI cheated/i,
    /\bI hurt|\bI broke|\bI forgot|\bI failed to|\bI should not|\bI shouldn't/i,
  ],
  lossGap: [
    /\bdied|\bdeath|\blost\b|\bseparation|\bseparated|\bleave\b|\bleft me|\bbroke up|\bdivorce/i,
    /\bpassed away|\bfuneral|\bnever see|\bdestroyed|\bgone forever|\bmissed the chance/i,
  ],
  irreversibility: [
    /\bdied|\bdeath|\bpassed away|\bfuneral|\bgone forever|\bpermanent|\bnever again|\bdestroyed/i,
  ],
  normViolation: [
    /\bunfair|\bunjust|\bcheat|\bbetray|\blied|\bstole|\bsteal|\babuse|\bcruel|\bimmoral/i,
    /\binsult|\bdeceived|\bpunished for|\btreated .* animal|\btreated .* thing/i,
  ],
  positiveProspect: [
    /\bhope|\bchance to|\bopportunity|\blooking forward|\bexpected to win|\bpromised/i,
  ],
  threatResolution: [
    /\bescaped|\bsafe\b|\brecovered|\bwas found|\bturned out well|\bnot injured|\bno longer/i,
  ],
  contamination: [
    /\brotten|\bspit|\bvomit|\bfilthy|\bdirty|\bbad smell|\bstinking|\bdecay|\bfaec|\bfeces/i,
    /\bpicked .* nose|\bdead animal|\bmaggot|\bblood on the food/i,
  ],
  socialExposure: [
    /\bin public|\beveryone|\bwhole class|\bin front of|\bpeople saw|\blaughed at|\bmock/i,
  ],
  harmToOther: [
    /\bI hurt|\bI injured|\bI harmed|\bpunished for something that I had done|\bbecause of me/i,
    /\bdisappointed my|\bmade .* suffer|\bcaused .* pain|\blet .* down/i,
  ],
  repairOpportunity: [
    /\bapolog|\bmake up for|\brepair|\bhelp them|\bcompensat|\bforgave/i,
  ],
  counterfactual: [
    /\bshould have|\bshouldn't have|\bif only|\bwish I had|\bwrong choice|\bcould have avoided/i,
  ],
  attachment: [
    /\bclose friend|\bbest friend|\bmy friend|\bmy family|\bmother|\bfather|\bparent|\bsister|\bbrother/i,
    /\bpartner|\bhusband|\bwife|\bchild|\bbaby|\brelative|\bsomeone I loved|\bpeople I loved/i,
  ],
  benefitFromOther: [
    /\bhelped me|\bsaved me|\bsupported me|\bgave me|\bdid .* for me|\bkind to me|\bforgave me/i,
  ],
  comparisonDisadvantage: [
    /\bothers .* better|\beveryone else|\bcompared with|\bmore successful than me|\bgot what I wanted/i,
  ],
  relationshipThreat: [
    /\bleft me for|\baffair|\bunfaithful|\brival|\breplaced me|\bpreferred .* to me/i,
  ],
  informationGap: [
    /\bdid not understand|\bdidn't understand|\bcould not explain|\bunknown|\bmystery|\bwondered why/i,
    /\bconflicting|\bmade no sense|\bwhat was happening|\bno explanation/i,
  ],
  repetition: [
    /\bagain and again|\bevery day|\brepeated|\broutine|\balways the same|\bmonoton/i,
  ],
});

function encodeIsearSituation(inputRecord) {
  const text = String(inputRecord?.observableBeforeInference?.situation || "");
  const appraisals = {};
  const set = (axis, value, confidence, matchedRules) => {
    appraisals[axis] = { value, confidence, matchedRules };
  };
  const matches = (ruleName) => RULES[ruleName].filter((pattern) => pattern.test(text)).length;

  const threatHits = matches("threatMagnitude");
  if (threatHits) set("threatMagnitude", Math.min(0.95, 0.62 + 0.16 * threatHits), 0.72, ["threatMagnitude"]);
  const immediateHits = matches("threatImmediacy");
  if (immediateHits) set("threatImmediacy", Math.min(0.95, 0.58 + 0.17 * immediateHits), 0.72, ["threatImmediacy"]);

  const lowControl = matches("lowControl");
  const highControl = matches("highControl");
  if (lowControl || highControl) {
    const value = clamp01(0.5 + 0.22 * highControl - 0.22 * lowControl);
    set("controllability", value, 0.68, ["lowControl", "highControl"]);
  }

  const obstruction = matches("obstruction");
  if (obstruction) set("obstruction", Math.min(0.95, 0.60 + 0.14 * obstruction), 0.7, ["obstruction"]);
  const blame = matches("blame");
  if (blame) set("blameCertainty", Math.min(0.95, 0.64 + 0.12 * blame), 0.68, ["blame"]);

  const positive = matches("positiveOutcome");
  const negative = matches("negativeOutcome");
  if (positive || negative) {
    const value = clamp01(0.5 + 0.20 * positive - 0.20 * negative);
    set("outcomeValence", value, 0.72, ["positiveOutcome", "negativeOutcome"]);
    set("goalCongruence", value, 0.64, ["positiveOutcome", "negativeOutcome"]);
  }
  const consumed = matches("rewardConsumption");
  if (consumed) set("rewardConsumption", Math.min(0.95, 0.55 + 0.12 * consumed), 0.68, ["rewardConsumption"]);

  encodePositiveAxis(appraisals, text, "expectedUncertainty", "uncertainty", 0.64, 0.12);
  encodePositiveAxis(appraisals, text, "unexpectedChange", "unexpectedChange", 0.62, 0.14);

  const safe = matches("socialSafety");
  const unsafe = matches("socialDanger");
  if (safe || unsafe) {
    set("socialSafety", clamp01(0.5 + 0.22 * safe - 0.22 * unsafe), 0.68, ["socialSafety", "socialDanger"]);
  }

  encodePositiveAxis(appraisals, text, "statusChallenge", "statusChallenge", 0.65, 0.12);
  encodePositiveAxis(appraisals, text, "selfAttribution", "selfAttribution", 0.70, 0.12);
  encodePositiveAxis(appraisals, text, "lossGap", "lossGap", 0.68, 0.14);
  encodePositiveAxis(appraisals, text, "irreversibility", "irreversibility", 0.76, 0.12);
  encodePositiveAxis(appraisals, text, "normViolation", "normViolation", 0.67, 0.13);
  encodePositiveAxis(appraisals, text, "positiveOutcomeProspect", "positiveProspect", 0.62, 0.12);
  encodePositiveAxis(appraisals, text, "threatResolution", "threatResolution", 0.68, 0.13);
  encodePositiveAxis(appraisals, text, "contamination", "contamination", 0.76, 0.12);
  encodePositiveAxis(appraisals, text, "socialExposure", "socialExposure", 0.66, 0.13);
  encodePositiveAxis(appraisals, text, "harmToOther", "harmToOther", 0.70, 0.13);
  encodePositiveAxis(appraisals, text, "repairOpportunity", "repairOpportunity", 0.62, 0.12);
  encodePositiveAxis(appraisals, text, "counterfactualBetterOption", "counterfactual", 0.68, 0.12);
  encodePositiveAxis(appraisals, text, "attachmentRelevance", "attachment", 0.56, 0.10);
  encodePositiveAxis(appraisals, text, "benefitFromOther", "benefitFromOther", 0.68, 0.12);
  encodePositiveAxis(appraisals, text, "comparisonDisadvantage", "comparisonDisadvantage", 0.66, 0.12);
  encodePositiveAxis(appraisals, text, "relationshipThreat", "relationshipThreat", 0.70, 0.12);
  encodePositiveAxis(appraisals, text, "informationGap", "informationGap", 0.66, 0.12);
  encodePositiveAxis(appraisals, text, "repetition", "repetition", 0.64, 0.12);

  set("goalRelevance", 0.62, 0.35, ["collectionPrior"]);

  return {
    schema: "isear_appraisal_encoding_v1",
    caseId: inputRecord.caseId,
    split: inputRecord.split,
    sourceGroup: inputRecord.sourceGroup,
    appraisals,
    audit: {
      encoderReadGold: false,
      usedExplicitEmotionWordRules: false,
      inputTextHash: inputRecord.caseId,
    },
  };
}

function predictIsearEmotion(inputRecord) {
  const encoding = encodeIsearSituation(inputRecord);
  const situation = inputRecord.observableBeforeInference.situation;
  const simulation = simulateEmotionSequence({
    profile: {
      chemicalBaselines: {},
      domainSelfEfficacy: 0.5,
      riskTolerance: 0.5,
      relationshipSecurity: 0.5,
    },
    initialPhysiology: { chemistry: {} },
    longTermContext: {},
    events: [{
      id: inputRecord.caseId,
      time: 0,
      description: situation,
      appraisals: encoding.appraisals,
      targets: { attentionTarget: "reported situation" },
    }],
  }, {
    emotionThreshold: 0.08,
    maxEmotions: 7,
  });
  const settledEmotions = projectEmotionsAtHorizon(simulation.frames[0].emotions, 60);
  return {
    schema: "isear_emotion_prediction_v1",
    caseId: inputRecord.caseId,
    split: inputRecord.split,
    sourceGroup: inputRecord.sourceGroup,
    evaluationTracks: inputRecord.evaluationTracks,
    encoding,
    predictions: settledEmotions.map((emotion) => ({
      family: emotion.family,
      intensity: emotion.intensity,
      onsetIntensity: emotion.onsetIntensity,
      confidence: emotion.confidence,
    })),
    predictionHorizonSeconds: 60,
  };
}

function encodePositiveAxis(appraisals, text, axis, ruleName, base, step) {
  const hits = RULES[ruleName].filter((pattern) => pattern.test(text)).length;
  if (!hits) return;
  appraisals[axis] = {
    value: Math.min(0.96, base + step * hits),
    confidence: 0.68,
    matchedRules: [ruleName],
  };
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

module.exports = {
  encodeIsearSituation,
  predictIsearEmotion,
};
