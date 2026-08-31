# V21 paired setup results

- Status: passed
- Date: 2026-08-29 Asia/Shanghai
- Scope: profile creation, episode start, deterministic comparison contract, and isolation audit only
- Player decisions submitted: 0 per arm
- Random observations consumed: 0 per arm

## Baseline

| Property | Treatment | Fresh control |
|---|---:|---:|
| Player | `ufs-v20-fresh-player` | `ufs-v21-fresh-control-player` |
| Input revision | 1 | 0 |
| Episode | `episode-0002` | `episode-0001` |
| Learned trajectories | 54 | 0 |
| Reinforced connections | 9 | 0 |
| Attention adjustments | 0 | 0 |
| Prediction ledger entries | 189 | 0 |
| Attention seed | 2026082920 | 2026082920 |

Both episodes started successfully and are stopped at
`choice/waiting_for_die_placement`, Round 1, action count 0. Their formal initial states are exactly
equal. Their compact public initial views are exactly equal after removing player ID, episode ID,
and profile revision.

The treatment profile SHA-256 is
`a1c3a2f13257cd89eea08581137ad1fedbd0b81addda0eff5a0ee4a4e9b8d92c`, identical to the archived
V20 revision 1 profile. The fresh control SHA-256 is
`a7cfa93079156374ab69fd5ea05c614a199d9df7ab9626cdf0ed343ae742d900`.

## Portability blocker fixed

The V20 profile initially failed its template guard because the original worktree hashed a mixed
LF/CRLF set of JSON bytes. The logical frozen assets were unchanged. Template fingerprints now
canonicalize JSON line endings to LF and accept a legacy raw-byte fingerprint only when that exact
fingerprint can be reproduced from LF/CRLF variants of the current identical assets. The episode
baseline records the canonical fingerprint
`acf9ac498ff320f0dd600223d0423834c2c4dfe1f697cd10ba89704a25d7b1dd`.

## Paired randomness

The committed tape uses seed `2026082921`; its SHA-256 is
`810cf1301352b204601549c850f106d34e2e5359f13b80c80349aa99d00c30c3`. Values are keyed by pending
boundary type, occurrence number, and sorted public die ordinal. The full-game CLI now accepts an
optional observation file on `random` and rejects mismatched operation types, missing/extra die IDs,
or values outside 1 through 6.

## Validation

- `verify-pair-baseline.js`: passed.
- UFS full test suite: 137/137 passed.
- `git diff --check`: passed; only existing LF-to-CRLF worktree warnings.

## Honest boundary

This setup proves isolation and comparability, not learning effectiveness. Neither arm has made a
decision in V21, so all five preregistered behavior comparisons remain unobserved. The next stage is
alternating paired play to the three-round gate, using the same controller configuration and the
precommitted random streams.

