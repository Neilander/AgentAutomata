# Player Profile Ensemble

Use this protocol when a design must survive different player assumptions and habits. A single knowledge-bounded Agent tests one path, not the breadth of player behavior.

## Principle

Keep the game, cognition engine, signal interpreter, emotion formulas, affordances, and decision API identical. Vary only durable player-owned starting data:

- structured prior beliefs and their confidence;
- attention priorities;
- risk and failure tolerance;
- experimentation tendency;
- perceived cost of swapping characters, equipping items, retrying, or reading details;
- preference weights such as damage, safety, novelty, collection, or simplicity.

Profiles bias decisions; they do not prescribe actions. All priors must remain learnable and falsifiable.

## Prior Schema

Store every belief in the normal causal knowledge shape:

```json
{
  "subject": "player_team",
  "environment": "general_combat",
  "behavior": "maximize_direct_damage",
  "result": "higher_win_probability",
  "confidence": 0.8,
  "source": "prior_game_habit",
  "status": "unverified_prior"
}
```

Do not inject hidden facts such as the correct counter, future reward, enemy formula, or designer lesson.

## Minimum Ensemble

Run at least these profiles for onboarding or lock-key validation:

1. **Open novice**: weak priors, explores visible actions, learns quickly from clear evidence.
2. **Damage absolutist**: strongly prefers complete damage heroes and believes healing/tanking lowers tempo.
3. **Safety conservative**: protects frontline and healing, avoids low-confidence fights and repeated losses.
4. **Low-friction optimizer**: compares combat evidence and changes team/equipment readily when expected gain is visible.
5. **Inertial player**: dislikes menus and swaps; retries the current setup until evidence becomes overwhelming.
6. **Novelty/collector player**: values new heroes, rare items, and untested options more than immediate efficiency.

Add a domain-specific adversarial profile when the design has a known bypass, such as all-range, all-melee, no-healer, rarity-chaser, or single-carry stacking.

## Execution

1. Freeze the game version, cognitive model, psychological parameters, and random-seed set.
2. Give every profile the same player-visible game state and affordances.
3. Keep one persistent decision Agent per profile across the whole episode. Call it only at decision nodes; code owns signals, knowledge matching, expectation, emotion, and state updates.
4. Use paired seeds across profiles and across design A/B versions.
5. Run at least two seeds per profile for exploratory diagnosis; use broader deterministic simulation after identifying a mechanical bypass.
6. Preserve every decision, prior used, evidence observed, belief update, hypothesis, emotion change, and next action.

The executable implementation is under `experiments/player_agent_api_loop_v1/`:

- `player-profiles.js`: ten predefined profiles and deterministic X-of-10 selection;
- `player-profile-ensemble.js`: paired independent sessions for the selected profiles;
- `ensemble-cli.js`: file-based orchestration for external Agent calls;
- `validate-player-profile-ensemble.js`: exact-two and count-two, two-cycle regression.

## Evaluation

Report profiles separately before summarizing:

- route and team/equipment history;
- intended lesson learned or bypassed;
- false priors strengthened, weakened, or unchanged;
- failures, retries, abandonment, and recovery;
- emotional curve and decisive evidence;
- final causal knowledge;
- whether success came from a coherent strategy, raw stat excess, luck, or an untested exploit.

Then build a cross-profile table:

```text
profile | reached lesson | used intended key | accidental bypass | corrected prior | stuck | final emotion
```

Do not accept a level because the average is healthy. Flag the design when:

- one broad prior wins without engaging with the lesson;
- the intended solution works only for the cooperative novice;
- several profiles converge on the same dominant composition regardless of evidence;
- a false prior cannot receive legible counter-evidence;
- the Agent changes behavior only because the prompt implies the intended answer.

Not every profile must win. A stubborn or mistaken player may fail, but the failure must produce understandable evidence and a viable route to revise the belief.

## Mechanical Backstop

Agent diversity does not replace enumeration. When the available roster is small, enumerate all legal teams at the intended equipment state. Use Agent profiles to explain discovery, interpretation, and adaptation; use exhaustive or stratified simulation to prove that unvisited compositions do not silently bypass the level.
