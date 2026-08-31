# UFS progressive-detail activation V0 results

- Run date: 2026-08-30
- Frozen learned profile: V24 attempt 02 revision 9
- Personal GTE: 275/275 real compiled trajectories
- Target: second placement completes a two-cell energy room, with reward delayed
- Close confuser: first placement leaves the two-cell energy room incomplete
- Retrieval: no applicability filter; Q-before and Q-after tested independently

## Result

The frozen coarse checks passed, but the trajectory was not smoothly monotonic as true relational detail was added.

### Q-before

| Level | Newly emphasized detail | Target rank | Close-confuser rank | Target minus confuser activation |
|---|---|---:|---:|---:|
| 1 | generic energy-room placement | 68 | 16 | -0.006100 |
| 2 | two-cell room | 14 | 5 | -0.012313 |
| 3 | second investment, occupancy `1→2` | 118 | 14 | -0.018110 |
| 4 | completion now, reward delayed | 104 | 110 | +0.003133 |
| 5 | visible die/cell IDs, `place_die`, phase | 3 | 70 | +0.018907 |
| exact ceiling | exact stored Q-before | 1 | 27 | +0.064471 |

### Q-after

| Level | Newly emphasized detail | Target rank | Close-confuser rank | Target minus confuser activation |
|---|---|---:|---:|---:|
| 1 | generic energy-room result | 157 | 188 | +0.005578 |
| 2 | two-cell room | 14 | 6 | -0.011205 |
| 3 | second investment, occupancy `1→2` | 3 | 5 | +0.001910 |
| 4 | completion now, reward delayed | 6 | 124 | +0.022483 |
| 5 | visible die/cell IDs, `place_die`, phase | 2 | 14 | +0.007607 |
| exact ceiling | exact stored Q-after | 1 | 18 | +0.044373 |

## Interpretation

The user's core expectation is partly confirmed: a sufficiently detailed complete scene can awaken the correct memory without an applicability filter. The final Q-before reached Top-3 and final Q-after reached Top-2, both above the close confuser. Exact stored endpoints remained rank 1.

However, the important generalizable conditions did not produce a reliable monotonic improvement. On Q-before, adding “second investment” and occupancy `1→2` made the target fall from rank 14 to 118. It recovered only after exact die ID, cell ID, operation name and phase were added. Q-after handled `1→2` better, rising to rank 3, but adding delayed-reward timing then moved it to rank 6 before exact identifiers restored rank 2.

This suggests the current embedding can match a very specific whole episode, while relational facts such as first-versus-second investment and `1→2` are not reliably represented as independent discriminators. Exact identifiers may be acting as retrieval shortcuts. The learned target Q itself stores specific die/action language and a narrative prediction; occupancy facts remain mostly in applicability/public state rather than as separately matchable structured conditions.

## Decision

Do not conclude that simply making Agent prose longer fixes activation. The next representation experiment should keep semantic broad activation but carry a small set of structured relational cues alongside it—operation, phase, relevant object identity/type, before value and expected after value—and measure their contribution without requiring episode-specific IDs. This can later feed the post-activation validation stage.

The Q-before/Q-after merger was intentionally not changed here. Its next design should preserve three candidate routes: high Q-before similarity, high Q-after similarity, and high joint similarity, using their union rather than one average-only ranking.

## Validation

- Real local `gte-multilingual-base` compiled 12 queries in one batch.
- All frozen coarse checks passed in both channels: final better than generic, final Top-3, at least three non-worsening additions, and final above confuser.
- No profile was written and no game action was submitted.
- Full UFS regression earlier in the same work unit: 156/156 passed; no cognitive runtime source changed after it.
- `git diff --check`: passed; only existing Windows line-ending warnings.

