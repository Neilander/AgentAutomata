# Persistent Real-Agent Roster Trace

This trace records the two decisions made by each persistent profile from only its
versioned request packet. The request files preserve the full profile priors,
visible evidence, legal alternatives, and code-owned roster predictions. The
response and settlement files preserve the chosen action and observed result.

## Open novice

- Round 1: chose `swap:2:area_mage`. It acknowledged that `strong_blade` had the
  higher raw predicted score, but preferred the mage's directly relevant area
  evidence in the visible many-target fight. Hypothesis: swarm handling should
  improve. Settlement: improved loss, `-0.25 -> -0.15`.
- Round 2: chose `swap:3:strong_blade`. The exact mage team had now failed, while
  adding the strongest reserve predicted `0.57`. Hypothesis: keeping the mage and
  adding the champion should improve beyond `-0.15`. Settlement: win, `0.70`.

## Damage absolutist

- Round 1: chose `swap:3:strong_blade`. It followed its damage preference and the
  largest visible prediction (`0.47`) instead of retrying the failed exact team or
  choosing the weaker guard. Hypothesis: the direct-damage upgrade should shrink
  the remaining-HP gap. Settlement: improved loss, `-0.25 -> -0.10`.
- Round 2: chose `swap:2:area_mage`. It retained the champion and added the mage's
  area damage; it rejected an unchanged retry and the materially worse guard.
  Hypothesis: faster swarm removal should improve beyond `-0.10`. Settlement:
  win, `0.70`.

## Safety conservative

- Round 1: chose `swap:3:strong_blade`. It preserved the known frontline and
  priest while replacing only the weakest member; it rejected the weak guard and
  unchanged retry. Hypothesis: the stable core plus stronger finisher should
  reduce the loss margin. Settlement: improved loss, `-0.25 -> -0.10`.
- Round 2: chose `swap:2:area_mage`. It retained the frontline, healing, and
  champion while making the only materially better remaining change. Hypothesis:
  area damage should solve the swarm without giving up defensive stability.
  Settlement: win, `0.70`.

## Low-friction optimizer

- Round 1: chose `swap:3:strong_blade`. All swaps were free and reversible, so it
  selected the highest predicted score (`0.47`) over the area mage (`0.242`) and
  retry. Hypothesis: the largest one-step improvement should most reduce the
  failure gap. Settlement: improved loss, `-0.25 -> -0.10`.
- Round 2: chose `swap:2:area_mage`. With the champion retained, the mage was the
  largest remaining positive prediction (`0.392`); retrying preserved an exact
  failed team. Hypothesis: the second free improvement should move the team past
  the encounter boundary. Settlement: win, `0.70`.

## Inertial player

- Round 1: chose `challenge:visible_swarm_gate`. It explicitly acknowledged that
  the champion and mage predictions were better, but their counterfactual
  confidence (`0.163` and `0.18`) was below its `0.82` evidence threshold and its
  change aversion was high. Hypothesis: the familiar retry was cheaper, though
  likely still unsuccessful. Settlement: similar loss, `-0.30`.
- Round 2: chose the unchanged retry again. Two visible failures raised the
  alternatives' confidence only to roughly `0.325-0.36`, still below `0.82`.
  It again differentiated the swaps but refused to act on them. Settlement:
  similar loss, `-0.30`.

## Novelty collector

- Round 1: chose `swap:2:area_mage`. It preferred the untested, encounter-relevant
  specialist over retry and the more general raw-strength upgrade. Hypothesis:
  the new area behavior should visibly improve swarm handling. Settlement:
  improved loss, `-0.25 -> -0.15`.
- Round 2: chose `swap:3:strong_blade`. It preserved the demonstrated mage change
  and tested the strongest remaining reserve; it rejected the weak novel guard
  and return to an exact failed roster. Hypothesis: the two distinct upgrades
  together should exceed `-0.15`. Settlement: win, `0.70`.

## Behavioral verdict

Five profiles reached the winning combination within two choices. The inertial
profile did not, but it consistently distinguished the alternatives and exposed
its blocking evidence threshold. Therefore the old failure-generalization bug is
not reproduced; the remaining inertial outcome is a profile calibration issue,
not a roster-expectation identity collapse.
