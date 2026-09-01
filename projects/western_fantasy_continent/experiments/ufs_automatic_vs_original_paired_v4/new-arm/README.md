# V4 sealed new arm

This directory contains only the new-policy arm of the fresh V4 paired experiment. It imports the shared `../safety-boundary.js` predicate and is sealed to the existing V2 `automatic-multicutpoint-controller.js` plus `UfsFullGameAttentionSession.imagineSequentialPlan()`.

The one formal run has already completed. `run-new-arm.js` refuses to overwrite existing evidence, so do not rerun it. The reproducible read-only check is:

```text
node projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/new-arm/verify-new-arm.js
```

The verifier checks the frozen protocol/assets/controller/helper, the pre-run host-free boundary test, the xorshift32 draw tape and public ID binding, all automatic traces, random-pause replanning, three safe boundaries, and the final checkpoint.

Do not infer a comparison from this arm. The old arm must independently use the same `PAIR_PROTOCOL.json` and exact shared boundary helper/hashes without reading this directory before sealing its policy and run.
