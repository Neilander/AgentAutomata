# Candidate Validation Plan: 2026-07-06_1519

Status: candidate text only.

No official skill or combat asset was modified.

Planned validation after blind review:

1. Implement approved action-pose candidates into a temporary candidate runtime.
2. Add explicit signal tags for the pose payoff:
   - charge start / release;
   - reload start / magazine burst;
   - counter absorb / counter shot;
   - alternating element chain;
   - return projectile hit.
3. Build 4 intent-matched teams plus 8 coherent random standard teams.
4. Test against strong-waterline top 20% or the nearest available bucket.
5. Reject candidates whose pose cannot be seen in battle signals.

Current validation is limited to syntax and JSON parsing. No local server or browser access test is run.
