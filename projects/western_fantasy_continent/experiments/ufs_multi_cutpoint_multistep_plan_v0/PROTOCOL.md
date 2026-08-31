# UFS multi-cutpoint multi-step planning V0

## Comparison

Compare the passed static single-anchor plan with a rolling plan on the same formal initial checkpoint, attention seed and public random outcomes.

The static control keeps its opening assignment: the final rerolled white die always goes to the tunnel in column 3. The rolling planner is allowed to reconsider only that still-uncommitted die after the reroll becomes public.

## Three cut-in points

1. **Result/intention-led:** at round start, preserve the earlier research primary anchor plus energy enabling anchor.
2. **Environment-led:** after the real white reroll, inspect the only remaining column, awaken AA/tunnel relations from Q-before, and compare only those grounded anchors through the entire committed remainder of the round.
3. **Operation-led:** once all dice are placed, derive energy → research → optional fighter order from available operations and resource dependencies, without enumerating all room-order permutations.

All three passes preserve trigger provenance. No pass averages Q-before, Q-after and operations.

## Why continuation depth matters

AA locally reduces ship descent by one, but that changed landing can alter which ships the already committed fighter room destroys. Therefore the second pass must imagine each of its two local anchors through research, fighter, spawning and the next-round boundary. Selecting by immediate movement alone is not sufficient.

The continuation uses the existing rule-memory cognitive imagination with full public attention. The formal host remains evaluation-only.

## Random comparison

Run all six possible values of the one remaining rerolled white die. For every value:

- static and rolling runs share the same initial state, prefix, reroll value and first-legal spawn policy;
- both AA and tunnel continuations are imagined cognitively and replayed formally;
- the rolling run selects the lower lexicographic public threat vector: damage, maximum ship row, then total ship rows;
- research, energy, damage, mothership and ship positions are recorded at the next-round-roll boundary.

Lower ship rows are safer because ships advance from row 0 toward the city as row increases. No fixed weighted utility is introduced.

## Pass conditions

- six paired random cases and exactly three cut-in points per rolling run;
- AA and tunnel are both awakened and only two second-pass anchors are compared;
- no die/cell Cartesian enumeration and no room-order permutation enumeration;
- cognitive full-continuation predictions match formal evaluation;
- rolling choice is never worse on damage, maximum ship row or total ship rows;
- research and energy from the first anchor are preserved;
- value 4 keeps tunnel because downstream fighter/spawn interaction makes AA worse;
- other five values switch to AA;
- aggregate reduction is exactly 18 total ship-row units and 7 maximum-row units across six cases.
