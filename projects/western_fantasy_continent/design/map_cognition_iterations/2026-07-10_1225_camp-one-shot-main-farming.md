# Camp One-Shot And Main Farming Correction

- Date: 2026-07-10
- Scope: first-region farming ownership
- Status: accepted correction

## Rule

```text
Camp = one-time key encounter and concentrated reward.
Main levels = repeatable farming locations.
```

Camp must not become the best permanent farming node, because that would collapse the region's farming space into one branch and weaken the meaning of main progression.

If the player still loses Prison after consuming the one-time Camp reward:

```text
Prison loss -> focus latest cleared main level -> farm for visible equipment change -> retry Prison
```

## Validation

200 deterministic first-region runs:

- Camp attempts: `200` exactly, one per run;
- completion within 30 actions: `99%`;
- average actions: `15.24`;
- average losses: `1.54`;
- first Prison failure: `158/200`;
- latest cleared main level becomes the repeat-farm fallback after the one-time Camp reward.

The remaining 1% did not deadlock; those seeds did not gain enough equipment before the 30-action test cap.

## Current Main Drop Tables

| Region | Items per clear | Item level | Common | Blue | Rare | Epic |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Region 1 main | 2 | 1-8 | 82% | 17% | 1% | 0% |
| Region 2 main | 3 | 12-24 | 52% | 36% | 10% | 2% |
| Region 3 main | 4 | 30-48 | 34% | 38% | 22% | 6% |

Each item rolls rarity independently. Current main-node tables are region-wide; later main nodes inside the same region do not yet have higher levels or better rarity odds.
