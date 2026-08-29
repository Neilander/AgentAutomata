# UFS V19 Clean2 Round Summaries

- Attempt: `state_attempt_2026082919_v19`
- Seed: `2026082919`
- Result: formal loss at Round 7, sequence `177`

## Round 1

- End sequence: `029`
- End state: energy 6, damage 0, researchIndex 0, excavatorIndex 1, mothershipRow 1
- Notes: the player built early energy/depth, but produced several rejected placement probes before finding legal placements.

## Round 2

- End sequence: `053`
- End state: energy 3, damage 0, researchIndex 2, excavatorIndex 2, mothershipRow 4
- Notes: research began, but mothership pressure jumped significantly.

## Round 3

- End sequence: `082`
- End state: energy 5, damage 0, researchIndex 3, excavatorIndex 3, mothershipRow 5
- Notes: this is the verified three-round gate. Both the experiment verifier and generic three-round audit passed.

## Round 4

- End sequence: `111`
- End state: energy 1, damage 2, researchIndex 6, excavatorIndex 8, mothershipRow 7
- Notes: player made useful research/depth progress but started taking damage and allowed mothership pressure to stay high.

## Round 5

- End sequence: `135`
- End state: energy 7, damage 3, researchIndex 6, excavatorIndex 13, mothershipRow 8
- Notes: energy and excavation were strong, but research stalled.

## Round 6

- End sequence: `156`
- End state: energy 6, damage 4, researchIndex 6, excavatorIndex 16, mothershipRow 10
- Notes: the system crossed the original V19 failure region cleanly. No duplicate full-attention item id crash occurred.

## Round 7

- Final sequence: `177`
- Final state: energy 6, damage 5, researchIndex 9, excavatorIndex 19, mothershipRow 11
- Outcome: `loss`, reason `mothership_reached_skull_row`

## Overall

This run proves the current public-contract/full-game loop can reach formal termination from a fresh V19 player. The biggest visible weakness is not the host loop; it is the chooser repeatedly attempting visible but illegal placements.
