# UFS learned-trajectory cognitive-field activation benchmark V1

## Frozen purpose

Measure whether the current cognitive-field activation prototype can retrieve already learned personal trajectories across exact, paraphrased, one-sided, convergent, noisy and near-miss situations. This benchmark measures recall only. It does not submit actions, change utility, capture a player, or learn during evaluation.

## Frozen player

- Learned profile: V24 attempt 02, `game-02-output-revision-9.json`.
- Player: `ufs-v20-fresh-player`, revision 9, 8 captured episodes, 931 experienced operations.
- Personal GTE: 275 trajectories, all 275 `compiled_matrix` before selection.
- Historical limitation: these trajectories predate explicit `memoryId`; provenance is audited through their preserved `full-game-feedback-*` refs.
- Fresh control: same frozen initial template with no personal feedback matrix. It is an ownership/isolation control, not a full initial-rule-GTE comparison.

No profile file may be edited. No `player-capture` or episode continuation is allowed.

## Frozen target selection

Six real learned rows were selected before running retrieval. Rows containing `undefined` in Q-after were excluded.

1. first placement into an incomplete two-cell energy room;
2. second placement completing energy-room occupancy while payoff remains delayed;
3. research choice with legal range `0..0`, so research stays unchanged;
4. ending rooms advances mothership row `5→6`;
5. a same-column placement produces damage level `3`;
6. resolving a zero-cost tunnel leaves energy unchanged.

Each target has a real semantically close confuser row from the same learned profile.

## Cue generation contract

The cue agent receives only `agent-inputs.json`: public state facts and cited player knowledge. Target trajectory IDs and expected ranks live separately in `oracle.json`.

Three root-Agent passes are recorded per situation. Each cue must cite non-empty `statePaths` and `knowledgeIds`. The passes are a controlled reproducibility sample, not independent-agent blinding or a model accuracy estimate.

## Evaluation cells

For each of six targets:

1. exact Q-before sanity;
2. exact Q-after sanity;
3. pass-1 paraphrased Q-before only;
4. pass-1 paraphrased Q-after only;
5. pass-1 combined;
6. pass-2 combined;
7. pass-3 combined;
8. pass-1 combined plus two cues from another situation;
9. exact close-confuser Q-before+Q-after as a target-specific negative;
10. unrelated situation cues as a target-specific negative.

That is 60 learned-profile cases. The same 60 cases are checked against the empty fresh personal store for ownership isolation.

All cue vectors are compiled in one real local `gte-multilingual-base` batch. Retrieval ranks all 275 personal trajectories with no applicability filter so this tests semantic activation rather than exact context gating.

## Frozen metrics and pilot thresholds

- Exact sanity Hit@1: `100%` required.
- Paraphrased positive Hit@3: at least `75%`.
- Combined pass-1 Hit@3: at least `5/6`.
- Three-pass stability: at least `4/6` targets must remain Top-3 in every pass.
- Near-miss target false Hit@3: at most `1/6`.
- Unrelated target false Hit@3: at most `1/6`.
- Cue grounding contract: `100%` of cues cite valid state paths and supplied knowledge IDs.
- Fresh personal-store candidates: exactly zero.

The V0 merge score is recall relevance only. Threshold calibration and downstream action benefit remain separate questions.
