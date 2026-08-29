# UFS V18 Round Summaries

## Round 1

The fresh player opened with energy/research economy priorities:

- Placed gray 4 into `A-upper-energy`.
- Placed white 1 into `A-upper-research`, triggering a white reroll.
- Completed the second half of `A-upper-energy` with gray 3.
- Used white 3 in `A-upper-fighter`, triggering another reroll and moving visible ships in column 1.
- Placed the remaining gray 3 into `A-upper-tunnel`.
- Resolved `A-upper-energy` after correcting the required `pay:true` field, increasing energy from 2 to 6.
- Resolved `A-upper-research`, which opened a research-choice substep with budget 1 and max advance 0.

The run then became blocked. The player attempted to choose zero research advance using multiple natural public payload field names, but the formal layer rejected all of them as an undefined research choice. The attempt stopped at sequence `017`.

No full round was completed.

