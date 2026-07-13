# Phase 2 Ranger Onboarding A/B

Date: 2026-07-13 07:01 CST

## Design Question

Can Region 1 deliver Ranger early enough for the player to voluntarily use the character and immediately learn the character's high-health single-target role from real combat, without modifying Frozen V3?

## Baseline Diagnosis

- The Prison is visible after Main 3 and the player chooses it at action 4.
- Under the accepted recovery candidate, the first Prison attempt wins in only 1/30 paired routes.
- Ranger is therefore rescued before the old Main 7 proof and before the Boss in only 1/30 routes.
- Corrected Ranger-specific proof auditing found 0/30 baseline routes with a Ranger proof; the earlier broad metric had incorrectly counted Mage proof events.
- The issue was gameplay ordering and encounter viability, not missing player affordance after V3.

## Isolated Candidate

- Copied the accepted recovery core into a separate Ranger-onboarding candidate.
- Scaled only the candidate Prison enemy team to `0.84` of its prior values.
- Moved the scaled high-health bear proof encounter from Main 7 to Main 4, immediately after the expected rescue and voluntary swap.
- Moved Ranger-specific role-proof settlement to Main 4.
- Restored Main 7 to the ordinary core encounter path.
- Did not modify formal gameplay, character skills, shared combat values, Frozen V3, or cognition parameters.

## Matched 30-Route Result

| Metric | Baseline | Candidate |
|---|---:|---:|
| First Prison win | 1/30 | 30/30 |
| Rescue before Ranger proof | 1/30 | 30/30 |
| Rescue before Boss | 1/30 | 30/30 |
| Immediate voluntary Ranger use | 30/30 eventually | 30/30 immediately |
| Ranger-specific visible proof | 0/30 | 30/30 |
| Confirmed V3 character experiment | 30/30 | 30/30 |
| Terminal route | 30/30 | 30/30 |
| Average actions | 16.9 | 14.0 |
| Average losses | 1.3 | 0.0 |
| Emotion after proof milestone | 43.7659 | 45.1408 |
| Emotion after first Boss action | 49.3775 | 54.9909 |
| Emotion gain per action | 1.0555 | 1.2136 |
| Final emotion | 55.7690 | 54.9909 |

Final emotion is lower because the candidate removes about 2.9 actions and the late post-Boss rescue spike. It is not evidence that the onboarding route is worse: proof/Boss milestone emotion and emotion gain per action are higher.

## Proof Robustness

- 100/100 short routes rescue Ranger and win Main 4.
- 100/100 produce Ranger-specific proof.
- Ranger damage share: average about 36.75%, minimum 32.2%.
- Proof duration: average about 11.67 seconds.
- The proof no longer depends on Mage evidence or a borderline 22% share.

## Independent Review

- Cognition-trace reviewer: ACCEPT.
- Progression/onboarding reviewer: ACCEPT.
- Both found no failing route in the checked sets.
- Both identified the same residual risk: Region 1 is now too lossless if a later beat does not restore meaningful resistance.

## Result

Accept the isolated Ranger-onboarding candidate for its narrow claim. Do not merge it into formal gameplay yet. The next Phase 2 question is where to restore a readable mid-region lock or resistance beat without breaking the new rescue -> swap -> proof chain.

