# V21 revision 1 vs fresh: three-round paired result

## Conclusion

The captured V20 feedback was loaded successfully, but it produced no measurable prediction or
decision benefit in this matched three-round sample. Revision 1 and the fresh control were
behaviorally identical.

This is a bounded null result, not proof that learning can never help. Two target hazards—zero
energy and research rollback—did not occur, while the observed incomplete-energy-room and ordinary
mothership-risk cases were handled equally by both players.

## Frozen boundary

- Both arms stopped at `status=random`, `reason=waiting_for_next_round_roll`.
- `completedRoundCount=3`, `pending.round=4`; the Round 4 roll was not submitted.
- Each arm has 41 records: one initial snapshot, 35 deliberate actions, and five consumed random
  boundaries.
- Both restored formal hosts are identical: Round 3/new-round boundary, energy 4, damage 0,
  research 1, excavator 0, mothership row 3, no outcome.

## Paired evidence

- Same attention seed: `2026082920`.
- Same precommitted random tape and exact observation at every random boundary.
- 41/41 paired public views match after excluding identity/revision/episode.
- Every submitted player choice matches exactly.
- 35/35 deliberate actions in each arm include an explicit prediction.
- Rejected submissions: 0 vs 0.
- Behavioral divergences: 0.

## Target cases

| Case | Result |
|---|---|
| Zero-energy trap | Not observed; energy never reached zero. |
| Incomplete energy room | Observed in Round 2. Both put one die into the two-cell `A-upper-energy`, predicted no immediate gain, saw it excluded from `resolvableRoomIds`, and did not try to resolve it. |
| Research rollback | Not observed; the mothership only reached row 3. |
| Mothership danger | Both predicted the increase at `end_rooms` and made identical choices. This was general deadline exposure, not the later rollback/skull hazard. |
| Invalid choice | Neither arm submitted one. |

Round 2 also exposed a research room with budget 2 and first cost 3. Both selected the legal
`advanceSteps: 0`. Round 3 exposed `maxAdvanceSteps: 1`; both selected 1. Each arm recorded one
contradicted ticket because the explicit prediction expected the energy decrease at the later
`choose_research_advance` operation, while the formal host had already charged the cost during
`resolve_room`. The research-increase portion was correct. This is identical timing error, not a
treatment/control difference.

## Private learning-state audit after the stage

| Measure | Treatment revision 1 | Fresh control |
|---|---:|---:|
| Input learned trajectories | 54 | 0 |
| Final learned trajectories | 83 | 29 |
| Input/final connection updates | 9 / 9 | 0 / 5 |
| Input/final prediction ledger | 189 / 253 | 0 / 64 |
| New ledger status | 37 confirmed, 1 contradicted, 22 unresolved, 4 ambiguous | identical |
| Pending tickets | 0 | 0 |
| Attention adjustments | 0 | 0 |
| Quarantined feedback | 0 | 0 |

Both arms added the same 29 trajectories and 64 ledger entries. The 35 new deliberate tickets and
29 automatic trajectory tickets had the same source distribution. Every automatically activated
trajectory was a `read-rule-*` trajectory; neither arm activated a stored `feedback-*` trajectory.
The treatment retained its nine prior connection updates, proving that personal learning remained
isolated and loaded, but those updates did not alter this sample's public behavior.

## Interpretation and next experiment

The present evidence supports: **feedback capture/persistence succeeded; downstream behavioral
effect is unproven and was absent here**. The lack of `feedback-*` activation is consistent with the
known `pending_matrix_compile` state of newly learned trajectories, although this experiment alone
does not prove that compile gap is the sole cause.

The highest-value next step is not an unstructured longer run. First connect learned feedback
trajectories to the active GTE/activation path, then repeat this exact paired protocol. Separately,
use targeted matched states to guarantee exposure to zero energy and research rollback.

## Validation

Run:

```powershell
node projects\western_fantasy_continent\experiments\ufs_revision1_vs_fresh_control_v21\verify-paired-stage1.js
```

Expected: `passed: true`, both stage gates true, 0 behavioral divergences.
