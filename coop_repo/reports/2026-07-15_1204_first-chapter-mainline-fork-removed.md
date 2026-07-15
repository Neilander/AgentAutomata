# Agent Handoff: First Chapter Mainline Fork Removed

- Date: 2026-07-15
- Agent/thread: Codex current task
- Scope: correct the accepted Chapter 1 topology and its integrated big-map rendering
- Status: complete

## User Intent

The previously validated first chapter had a linear Main 1-10 route. The integrated map must not show a fork between Main 6-9. Prison and Camp remain intentional optional branches.

## Completed

- Audited the July 14 report against the current accepted core and found a stale topology bug: Main 9 still allowed either Main 7 or Main 8 despite the report saying Main 8 follows Main 7.
- Changed the accepted Chapter 1 core to a strict linear mainline: `Main1 -> ... -> Main7 -> Main8 -> Main9 -> Main10 -> Boss`.
- Removed the rendered `Main6 -> Main8` and `Main7 -> Main9` fork links and aligned Main 7-10 visually along the main route.
- Preserved the two intentional optional branches: Prison after Main 3 and Camp after Main 5.
- Added `mainlineIsLinear` to the machine-readable design intent and documented the invariant in the human-readable design tree.
- Strengthened both first-region and integrated-map regressions so Main 9 must require Main 8 and may not use alternate predecessors.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core-phase2-midlock.js`: linear Main 1-10 requirements.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: linear mainline links and node positions.
- `projects/western_fantasy_continent/map_progression_lab/verify-first-region-design-intent.js`: explicit Main 9 topology assertions.
- `projects/western_fantasy_continent/map_progression_lab/first-region-design-intent.json`: immutable linear-mainline contract.
- `projects/western_fantasy_continent/map_progression_lab/FIRST_REGION_DESIGN_INTENT.md`: human-readable linear-mainline rule.
- `projects/western_fantasy_continent/map_progression_lab/validate-integrated-two-chapter-map.js`: integrated fork regression.

## Validation

- `verify-first-region-design-intent.js`: PASS, 100 samples; all prior lock-key and Ranger metrics unchanged.
- `test-map-cognition-v3-midlock.js`: PASS.
- `validate-integrated-two-chapter-map.js`: PASS.
- Browser runtime: all ten main nodes form a monotonic linear path; no page errors or console warnings.
- Visual inspection: no central mainline fork remains; Prison and Camp are visibly separate optional branches.

## Current State

The accepted core and the human map now agree with the July 14 written design: Main 8 follows Main 7, and Main 9 follows Main 8. The earlier topology passed because the verifier only checked that Main 8 required Main 7; it did not check Main 9's predecessor. That coverage hole is now closed.

## Unresolved

- The optional Prison/Camp branches remain by design. Removing those would destroy the Chapter 1 lock-key lesson rather than fix the stale mainline fork.

## Recommended Next Step

Continue the fresh human playtest from Main 1, treating any further structural discrepancy between the written design tree and the visible map as a blocking regression.
