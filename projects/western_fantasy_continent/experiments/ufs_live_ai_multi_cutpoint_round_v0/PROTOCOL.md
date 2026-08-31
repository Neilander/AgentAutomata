# UFS live AI multi-cutpoint round V0

## Question

Can a live AI player, using only the compact attention-limited player view and its prior public history, improve one formal round by generating a plan at the opening and revising it after new public information?

## Paired branches

- `static`: executes the opening AI plan without revising its remaining placements.
- `rolling`: executes the same opening prefix, then lets the AI inspect the new public view and revise the remaining plan.
- Both branches use the same attention seed and the same externally supplied random observations.
- The formal host alone applies actions and reports outcomes. The AI does not inspect host checkpoints or attention-audit files while deciding.

## Decision boundary

Every AI decision is written before its associated formal host action. Each decision records:

1. the visible cues used as a cut-in;
2. the recalled/imagined multi-step method;
3. the complete remaining plan and fallback;
4. the expected benefit and known uncertainty.

## Comparison

Compare legality/rejections, research, energy, damage, mothership position, maximum ship row, total ship rows, and whether rolling planning changed the opening plan. This is one paired round, not evidence of win-rate improvement.
