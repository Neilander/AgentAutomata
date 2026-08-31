# UFS single-anchor multi-step planning V0

## Question

Can one planning pass start from an Agent's macro intent and the currently visible environment, awaken a small set of methods, choose a multi-step anchor and fill all five dice without enumerating every die/cell permutation?

This is deliberately one pass with one cut-in point. Replanning from different cut-in points is the next experiment, not part of V0.

## Boundary

- The checkpoint is the formal UFS initial state with five real dice and full public attention. Full attention removes omission noise for this first structural test; it does not expose formal hidden state.
- `agent-intent.json` is a frozen one-shot Agent summary of that visible response plus owned rule knowledge. V0 does not test whether repeated intent summaries are stable.
- Q-after intent activation and Q-before environment activation use the real local GTE against the existing compiled rule-reading trajectories.
- The two activation groups are unioned with route provenance. They are not averaged and do not need to agree.
- Trigger-side relevance is checked before a rule becomes an actionable capability. Actual room visibility, accessibility, energy and cell availability are checked afterwards.
- The planner generates one anchor-centred plan. It must report zero Cartesian die/cell candidates.

## Expected plan shape

The primary intent is research progress, but paying the visible upper research room directly would reduce energy from 2 to 0. The environment can awaken the visible two-cell energy room as an enabling anchor. A successful plan should therefore:

1. reserve the strongest non-reroll die for the accessible research room;
2. complete the two-cell energy room with the other two gray dice;
3. place the two white dice into secondary fighter/tunnel roles;
4. resolve energy before research, choose the maximum currently offered research advance, and retain at least one energy;
5. treat the white reroll as a public contingency, not planner foreknowledge.

## Controls

- Run the existing single-step planner read-only on the same checkpoint and record its candidate count and first recommendation.
- Hash the live checkpoint before and after planning.
- Execute the generated plan in a separate formal session. The fixed reroll value is supplied only after the host exposes the public random boundary.

## Pass conditions

- both intent and environment activation groups exist;
- research and energy methods are awakened on their triggering sides;
- primary research plus enabling energy anchors are selected;
- all five dice and all five columns are used once;
- zero Cartesian placement enumeration and exactly one complete plan;
- planning is read-only;
- formal replay rejects no action, reaches research 2 and keeps energy above zero.
