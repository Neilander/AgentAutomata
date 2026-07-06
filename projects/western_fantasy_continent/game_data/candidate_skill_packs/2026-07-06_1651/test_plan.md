# Test Plan

No executable combat validation was run in this heartbeat round.

The intended next validation step is:

1. Implement 3-4 highest-rated candidates in a temporary runtime only.
2. For each candidate, build:
   - 4 target-synergy teams;
   - 3 near-target teams;
   - 5 logic-random standard teams.
3. Test against the current strong waterline top 20%.
4. Record:
   - win-rate uplift;
   - output / healing / shield / survival contribution;
   - whether the intended fantasy appears in combat logs;
   - whether the best team requires narrow over-specialization.

Do not move any candidate into official skill data until it passes blind preference review and runtime signal validation.
