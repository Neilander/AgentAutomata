# UFS V20 root audit and player capture

- Root audit: passed
- Canonical player: `ufs-v20-fresh-player`
- Base profile revision: 0
- Captured profile revision: 1
- Episode: `ufs-v20-fresh-player-episode-0001`

## Evidence

- 125 public records; 0 nonzero CLI exits.
- Response statuses: 101 choice, 18 random, 5 atomically rejected, 1 complete.
- The first 48 records were deterministically replayed from the fresh player profile and matched every public response.
- The replay restored at completed Round 3, phase `new_round`, before Round 4 dice.
- Final checkpoint restored and matched the last public response.
- Formal outcome: Round 8 loss, `mothership_reached_skull_row`.
- 106/106 deliberate recorded actions carried explicit pre-action prediction declarations.

## Feedback learning

- Prediction ledger: 189 tickets.
- Confirmed: 37.
- Contradicted: 38.
- Unresolved because the relevant result was not fully noticed: 110.
- Ambiguous: 4.
- Learned trajectories in the captured player: 54.
- Reinforced connections: 9.
- Attention adjustments: 0.
- Quarantined feedback: 0.
- Pending prediction tickets at capture: 0.

The one-time capture completed successfully. The state directory is sealed and the player profile now has revision 1 with one captured episode and 119 accepted operations experienced.

