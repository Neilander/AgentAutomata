# UFS planning player final-evaluation freeze

Frozen before the first final-suite run on 2026-08-16.

## Policy and environment hashes

- `beam-player.js`: `6681eebdf16b7709d176bc3bc839d3f6215bfea69b4497c6be313de09ad1fd0d`
- `player-api.js`: `77850a90e0d24e3ddc8e5e41dc779d03c1c507bc48ba3c4487a46db0dc21f9c5`
- `episode-runner.js`: `cd3f6bd78feeddb9571d67c2a289908af8dfdc9de1f39a2e1294a928e39e764b`
- `seed-suites.js`: `d72715a566c5bd19bbf07b625454cc39df1e3ee4e98bcb3a1b302516869fe6d1`
- `standard-engine.js`: `80116df0f7d3bcc9d8cd48cab0b7c272f9116c274e54a035de6c5c6ddd11b31b`
- `fixtures/roswell-threat-0-map.js`: `d932aa7f3d21a022bdae9aee11258ec47b5d01a04d0c0efaad979c99295708a0`

## Pre-final evidence

- smoke 8: 4 wins, 50.0%.
- train 30: 22 wins, 73.3%.
- dev 30: 19 wins, 63.3%.
- The final 100-seed suite had not been run when these hashes were recorded.

## Information boundary

The episode runner owns the hidden seed and RNG state. The player receives only the public observation and current legal actions. It receives no seed, RNG state, future dice, candidate future states, expected answer, best route, or other player's trace. White-die planning uses a fixed public-probability approximation rather than the episode RNG.

The final suite is evaluation-only. Its result must not be used for another tuning pass.
