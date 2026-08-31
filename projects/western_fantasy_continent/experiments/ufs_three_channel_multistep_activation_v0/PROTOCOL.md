# UFS three-channel multi-step activation V0 protocol

## Frozen question

Can an assumed-learned multi-step trajectory be awakened by independently considering high Q-before similarity, structural operation-sequence compatibility and high Q-after similarity, without summing or averaging the three signals?

## Memory and queries

Reuse the no-episode-ID controlled bank from `ufs_structured_relation_activation_v0/fixture.json`:

- correct `resolve research room → advance 2`;
- same start but advance 0;
- same endpoints but reversed operation order;
- energy-room confuser.

Queries are three paraphrases of the correct trajectory, one reversed-order query and one zero-advance query. Natural-language phrasing is assumed to have already been normalized into the fixture's typed relations; extractor reliability is outside this test.

## Independent channels

1. Q-before is encoded and compared by real GTE without operations or Q-after.
2. Operations are compared structurally, not embedded into Q-before:
   - operation count;
   - type at each ordered position;
   - named parameter matches and conflicts.
3. Q-after is encoded and compared by real GTE without Q-before or operations.

No joint vector, sum, weighted score or average is permitted.

For Q channels, “high” means within `0.0005` cosine similarity of that channel's best candidate. This retains exact/near ties instead of forcing a single winner. Operation status is `exact`, `compatible` or `conflict`; the frozen full queries require `exact`.

## Activation classes

- `complete_convergence`: Q-before high, operation exact, Q-after high;
- `method_convergence`: Q-before high and operation exact, but Q-after not high;
- `result_convergence`: operation exact and Q-after high, but Q-before not high;
- remaining candidates retain their individual channel evidence without being called a complete wake-up.

## Frozen checks

- Every query has exactly one `complete_convergence` candidate, equal to its expected memory.
- Correct and reversed queries remain distinct despite identical endpoint states.
- All three correct paraphrases produce the same channel classification.
- Output contains no joint/average similarity field.
- No runtime or player profile is modified.

