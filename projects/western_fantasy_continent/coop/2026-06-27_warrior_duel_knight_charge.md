# 2026-06-27 Warrior Duel And Knight Charge

## Goal

The prior warrior and knight secondary skills were usable but not sharp enough. This pass keeps the old skills and adds two clearer directions:

- Warrior: duel specialist.
- Knight: charge initiator.

## Design

### Duel Warrior

Fantasy: the warrior points at one target and turns the fight into a personal contest.

Player-facing change:

- The warrior applies a `duelTimer` to the current target.
- The warrior passive deals more damage to the dueled target.
- The ultimate refreshes the duel window and makes one heavy single-target strike.

Added skills:

- `duelChallenge`: small skill, applies duel window, hits target, briefly guards.
- `duelistOath`: passive, gains damage against dueled targets and small self stats.
- `singleCombatVerdict`: ultimate, refreshes duel and lands a heavy strike.

### Charge Knight

Fantasy: the knight is no longer only a wall; it opens the fight by crashing into the enemy line.

Player-facing change:

- The knight casts early.
- The knight hits multiple nearby enemies.
- The knight slows disrupted enemies and briefly draws pressure.
- The passive rewards hitting slowed enemies, so the charge window matters.

Added skills:

- `lanceCharge`: small skill, early charge, hits two enemies, slows them, briefly taunts.
- `chargerMomentum`: passive, slightly more power, slightly less armor, stronger into slowed targets.
- `royalCavalryBreak`: ultimate, larger charge into three enemies, slow window, self guard.

## Runtime Note

Added `duelTimer` to the combat timer tick list so duel windows expire normally. This does not change targeting, action priority, cooldown flow, death handling, or shared combat rules.

## Validation

Ran:

- `build-skill-assets`
- `validate-skill-assets`
- `node --check` for changed runtime files
- `analyze-archetype-signals`
- `redteam-skill-pool`
- `simulate-archetype-matchups`
- `analyze-skill-budget`

Results:

- Skill assets valid.
- Existing archetype signal contracts pass.
- Red-team risky candidates: 0.
- Top red-team watch candidate is 63.1% average win rate, below breaker threshold. It uses a berserker/charge-knight/warlock/bard shell, so future buffs to charge-frontline safety should be treated carefully.
- Standard matchup matrix remains in review from inherited ecology issues, not from this narrow skill addition.

## Residual Risk

The new skills have not been browser-playtested for feel. The main thing to inspect next is whether `duelTimer` and charge slow windows are visually obvious enough in the character skill UI and battle feedback.
