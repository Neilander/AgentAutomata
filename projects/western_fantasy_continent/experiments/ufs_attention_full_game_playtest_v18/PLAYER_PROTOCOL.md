# V18 isolated-player live-play protocol

## Information boundary

- Make choices only from recorder stdout, `evidence/`, `current-player-view.json`, this protocol, and your own notes.
- Do not read the host checkpoint, attention/feedback audit transcripts, source code, old playtest decisions, payloads, results, or reports while choosing.
- Do not use the formal engine as a strategy oracle. A wrong prediction is valid evidence; hidden-state leakage is not.

## Recorded operation

Every operation must use:

```text
node record-public-step.js <NNN> <start|advance|random> "<brief pre-action judgment>" [payload-json]
```

- Start with sequence `001 start`.
- Increment the sequence only after a machine ledger entry was created.
- At public `status=random`, use `random`; never invent dice.
- Use only IDs, bounds, and operations exposed by the current public response.
- A rejected game operation remains part of the only attempt. Explain the mistake and recover in the same state; never restart.

## Predictions

Put 1-3 predictions on each deliberate `advance` payload when a rule-based prediction is possible:

```json
{
  "type": "place_die",
  "dieId": "D1",
  "cellId": "...",
  "predictions": [
    {
      "because": "brief rule or planning reason known before acting",
      "expectations": [
        {"itemId": "die:D1", "field": "placed", "change": "equals", "value": true}
      ]
    }
  ]
}
```

Allowed expectation changes are `increase`, `decrease`, `changed`, `unchanged`, `equals`, `present`, and `absent`. Predictions must describe what the player actually expects, including uncertainty or likely mistakes; do not retrofit them after seeing the result. Random observations need no prediction.

Other public choice payload types are `resolve_room`, `choose_research_advance`, `excavate`, `skip_worker`, `end_rooms`, and `choose_spawn`. Follow the current public candidate IDs and bounds.

## Reasoning record

The recorder writes every pre-action judgment to `DECISIONS.md`. State concisely:

- current macro need;
- candidates seriously considered;
- why one was rejected or preferred;
- expected immediate consequence;
- whether the expectation comes from a rule, prior feedback, or uncertainty.

Do not expose private chain-of-thought. Record only a short decision rationale suitable for audit.

## Stage gate and finish

1. Stop at the first Round 4 next-round-roll response with `completedRoundCount=3`; do not submit Round 4 dice yet.
2. Run `node verify-public-evidence.js stage1` and `node ../ufs_first_action_imagination_v0/audit-three-round-gate.js . 3`.
3. Write `STAGE1_RESULTS.md` with the outcome. If either check fails, stop and document the system issue.
4. If both pass, continue the same attempt to the first formal win/loss outcome.
5. Run `node verify-public-evidence.js final` and write `RESULTS.md`, `ROUND_SUMMARIES.md`, and a new timestamped report under `coop_repo/reports/`.
6. Do not run `player-capture`; root will audit pending predictions and perform the one-time capture.
7. Do not edit `coop_repo/LATEST.md` or `coop_repo/REPORT_INDEX.md`. In chat, report only that the files are written.

