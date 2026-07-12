# Probability Expectation

Use this model for loot drops, critical hits, rare encounters, random upgrades, proc effects, and other repeated probability events.

## Ownership Boundary

The cognition layer estimates probability and maintains the player's internal counters. `A` does not learn probability; it only converts the signed difference between expected and observed result into surprise or disappointment.

```text
recognized event family -> probability belief -> expected result -> observed result -> A(mismatch)
```

## Event-Family Belief

Maintain separate counters for contexts the player can reasonably distinguish, such as:

- ordinary enemies in this region
- elites
- bosses
- chests
- a named skill proc

For each family, store:

```text
opportunities
successes
dry streak
estimated probability
confidence/uncertainty
expected resolution horizon
```

A simple Beta-Bernoulli update is sufficient:

```text
p_hat = alpha / (alpha + beta)
success: alpha += 1
miss: beta += 1
```

Choose priors from communicated rules and observed onboarding evidence. Do not give the player the designer's true probability.

## Early Uncertainty

Before the player knows the probability, feedback comes partly from information gain: each early success or miss teaches what this source can do. Do not model this as certainty that every opportunity should reward the player.

As observations accumulate:

- uncertainty and information gain decline
- per-opportunity expectation approaches the learned probability
- attention can shift from individual enemies to a wave/run horizon

## Resolution Horizon

Do not punish every non-drop as a failed expectation. A player who believes the rate is 10% usually expects roughly one result over several kills, not a reward from every kill.

Resolve mismatch when one of these happens:

- the event succeeds
- an explicit promise/deadline expires
- a wave or run ends
- the dry streak becomes statistically surprising

For learned probability `p` and dry streak `k`:

```text
P(no success for k opportunities) = (1 - p)^k
dry_surprise = -log(P)
```

Apply disappointment only after the dry streak exceeds the player's learned tolerance or an explicit expectation was missed.

## Result Staging

A probabilistic reward can produce several distinct signals:

```text
event occurs -> visible reveal -> pickup -> appraisal -> decision -> later verification
```

Do not double-count them as one large result. Attribute each stage to what the player can know at that time.

For equipment dropped during combat:

- combat-time feedback may use visible rarity and the fact that an item appeared
- build relevance is unknown until appraisal
- equipment choice occurs between encounters in the current design
- growth verification occurs in the next combat

Do not require in-combat build evaluation when the player is not allowed to change equipment until after the fight.

## Minimum Event Contract

```js
{
  time,
  type,
  family,
  opportunity: true,
  occurred,
  visibleMagnitude,
  context,
  explicitPromise: false
}
```

The runtime updates belief first only after calculating feedback from the prior belief. This preserves surprise: predict, observe, resolve, then learn.

