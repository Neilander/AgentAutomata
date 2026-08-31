# UFS multi-cutpoint multi-step planning V0 results

- Run date: 2026-08-31
- Checkpoint: formal initial UFS state
- Attention: full public
- Shared random cases: remaining white reroll values 1–6
- Cut-in points per rolling run: 3
- Second-pass anchors per case: 2
- Cartesian placement enumeration: none
- Room-order permutation enumeration: none
- Frozen checks: 12/12 passed

## Compared systems

The static single-pass control keeps the earlier five-die plan unchanged after it is created. Its final white die always remains assigned to the tunnel in column 3.

The rolling planner uses three different cut-in points:

1. Q-after intention plus Q-before opening environment form the research primary anchor and energy enabling anchor.
2. After the final white value becomes public, a new Q-before environment cue awakens only the grounded AA/tunnel choices in the last open column. Each is imagined through the already committed energy, research, fighter and spawn continuation.
3. At the room boundary, the available operations create an operation-led dependency order: energy → research → optional fighter → end rooms.

The comparison fixes the initial state, attention seed, reroll value and first-legal spawn policy. The formal host is used only after planning to evaluate both second-pass alternatives.

## Second activation

For all six reroll values, the structured environment query put these memories inside Top-6:

- `aa_room` reduced-descent relation: accepted Q-before activation;
- same-column movement relation: accepted supporting activation;
- `tunnel_no_room_output`: accepted Q-before activation.

For reroll 4, AA and ordinary movement tied at 0.797837; the tunnel relation was 0.738050. Trigger-side checks grounded exactly two actionable anchors, AA and tunnel, in the only remaining column.

## Paired formal result

Lower ship rows are safer. No weighted scalar score was introduced: comparison used damage first, then maximum ship row, then total ship rows.

| Reroll | Static final room | Rolling choice | Static max / total rows | Rolling max / total rows | Benefit |
|---:|---|---|---:|---:|---|
| 1 | tunnel | AA | 5 / 13 | 5 / 11 | total -2 |
| 2 | tunnel | AA | 6 / 13 | 5 / 13 | max -1 |
| 3 | tunnel | AA | 7 / 17 | 6 / 13 | max -1, total -4 |
| 4 | tunnel | tunnel | 5 / 11 | 5 / 11 | unchanged |
| 5 | tunnel | AA | 9 / 21 | 5 / 11 | max -4, total -10 |
| 6 | tunnel | AA | 10 / 23 | 9 / 21 | max -1, total -2 |

Across all six cases:

- total ship-row reduction: 18, average 3 per case;
- maximum-row reduction: 7, average 1.166667 per case;
- research difference: 0;
- energy difference: 0;
- damage difference: 0;
- rolling plan worse on the threat vector: 0/6;
- changed the second anchor: 5/6;
- deliberately retained the static tunnel anchor: 1/6.

Every run still completed research `0 → 2`, retained energy 1 and reached the next-round-roll boundary without formal rejection.

## Why value 4 matters

A one-step environmental rule says AA reduces same-column descent by one, so a purely local replanner would choose AA for value 4 as well. That is wrong after the rest of this plan is included:

- value-4 tunnel continuation ends at maximum row 5, total rows 11;
- value-4 AA continuation ends at maximum row 7, total rows 17.

The altered landing positions change which ships the already committed fighter room destroys and where they respawn. Full multi-step imagination caught this interaction and kept tunnel. This is the most important result: repeated planning helps only if the new cut-in is evaluated through its downstream interaction with retained anchors.

## Cognitive prediction audit

For every reroll value, both AA and tunnel were imagined with the existing rule-memory cognitive runtime before formal evaluation. All 12 cognitive continuations exactly matched the formal energy, damage, research, mothership and threat vectors.

The second pass compared only two environment-awakened anchors. The third pass derived room order from dependencies and generated zero order permutations. This remains anchored local search, not a hidden full-board enumeration.

## Verdict

**Multi-cutpoint benefit: PASS for this one-round comparison.** Rolling planning preserved the original research/energy achievement while improving or preserving the final ship-threat vector in all six public reroll outcomes. It also demonstrated a valid non-change decision when a tempting new environmental anchor was worse after downstream consequences.

This does not establish improved win rate or general multi-pass competence.

## Limits

- One initial checkpoint and full public attention only.
- The first macro intent remains a frozen Agent summary.
- The six cases exhaust this one rerolled die, not other dice, attention seeds or later rounds.
- The second cut-in is deliberately constrained to two visible last-column anchors.
- The threat ordering is explicit and hand-selected for this comparison; contextual value learning remains unresolved.
- The same first-legal spawn policy is shared but not optimized.
- Activated memories are rule-reading memories, not new personal feedback trajectories.
- The planner is isolated and has not replaced the live session planner.

## Evidence

- [`PROTOCOL.md`](PROTOCOL.md): frozen comparison and pass conditions.
- [`evidence/multi-pass-result.json`](evidence/multi-pass-result.json): GTE activations, all cognitive continuations, all formal outcomes and checks.

## Validation

- Focused multi-cutpoint tests: 2/2 passed.
- Real-GTE/cognitive/formal frozen checks: 12/12 passed.
- Full UFS regression suite: 156/156 passed.
- `git diff --check`: passed; only existing Windows line-ending warnings were emitted.
