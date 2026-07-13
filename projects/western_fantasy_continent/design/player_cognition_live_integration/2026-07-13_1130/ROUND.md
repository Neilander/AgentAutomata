# Phase 2 Combined Candidate: Playable Region 1

## Question

Can the three accepted isolated candidates coexist in one human-playable Region 1 without changing Frozen V3 or erasing each other's intended beats?

The three candidates are:

1. Prison rescue -> voluntary Ranger swap -> Main 4 contribution proof.
2. Main 6 heavy-shield soft lock -> Bandit armory key -> immediate verification.
3. Boss loss -> visible Main 9 equipment preparation -> awakened Boss retry.

## First Combination Failure

The unmodified mid-lock candidate completed 60/60 routes, but produced zero Boss losses. The Bandit armory's visible equipment growth erased the accepted Boss-recovery beat.

This was a real cross-candidate gameplay conflict, not a player-model defect.

## Combined-Only Adjustments

- Created `map-progression-cognition-core-phase2-combined.js`; the three accepted isolated cores remain unchanged.
- Raised only the combined candidate Boss team multiplier by `1.18` so the terminal gate remains visible after the Bandit key.
- Raised the active Main 9 preparation drop from three to four items. This keeps recovery within the previously accepted two-to-five action range after the stronger combined Boss.
- Frozen V3 runtime, policy, adapter, and player parameters were not changed.

## Sixty-Route Result

| Check | Result |
| --- | ---: |
| Terminal routes | 60/60 |
| Ranger rescue/swap/proof | 60/60 |
| Main 6 first-attempt losses | 37 |
| Main 6 key recoveries | 37/37 |
| Existing-build Main 6 bypasses | 23 |
| Boss first-attempt losses | 13 |
| Boss preparation and retry wins | 13/13 |
| Boss preparation actions | average 3.154, maximum 5 |

The valid Boss claim is bounded: a failed route enters one to five visible Main 9 preparation actions and then retries successfully in this sample. It is not a claim that one preparation action always suffices.

## Human Candidate

`map_progression_lab/candidate-v3.html` is a separate page and separate save. It provides:

- player-selected visible challenges;
- voluntary reserve-character swaps;
- the shared real-time battle renderer and unified combat engine;
- current goal, learned knowledge, equipment score, latest result, incoming-damage diagnosis, and event history;
- no replacement of the formal map page.

The page was loaded at 1440x900 in headless Chrome. Nodes, team, reserve characters, battle mount, and cognition panel rendered without overlap. Evidence screenshot: `design/player_cognition_live_integration/candidate-v3-ui.png`.

## Independent Review

- Cognition/causality reviewer: ACCEPT after the recovery assertion was corrected and the bounded preparation loop passed.
- Human-play reviewer: ACCEPT with risks. The largest risk is that the visual battle and state settlement currently rerun the same deterministic seed rather than sharing one result object.

## Bounded Claims And Risks

- The model observes named shield/armor counter activation, but retry choice is still primarily driven by visible power growth. This does not prove semantic understanding of counter taxonomy.
- The three learning chains are conceptually separate but numerically ordered: the Bandit key affects later Boss readiness, requiring a combined-candidate Boss fit.
- Human failure diagnosis currently identifies dominant incoming damage, not a complete build diagnosis.
- Candidate UI depends on shared battle, signal, and field-effect files, so formal-map regressions remain required when those shared files change.
- Browser interaction was not automatically clicked end-to-end; static render and core/action regressions passed, while final tactile judgment remains human play.

