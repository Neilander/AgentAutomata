# Signal Concept Interpretation

This reference defines the boundary between engine events and player knowledge.

## Position In The Loop

```text
engine event
-> player-visible signal
-> visible feature extraction
-> concept match
-> concept-level semantic event
-> expectation / emotion runtime
-> subject-environment-behavior-result knowledge
-> attribution and next decision
```

The signal interpreter runs before expectation, emotion, and knowledge updates. Knowledge cleanup after ingestion is not an acceptable substitute because hidden names and IDs would already have affected cognition.

Keep two logs:

- `rawEventLog`: engine identities and complete data for debugging only. Never send it to the player agent.
- `eventLog`: player-semantic events. The emotion runtime, knowledge builder, attribution request, and decision request may read this log.

## Concept Shape

A concept is a player-side category with a visible definition:

```text
id: enemy_minion_melee
label: 近战小怪
category: enemy_archetype
definition:
  ordinary enemy
  repeatedly presents close-range strikes, cleaves, bites, or collisions
```

Concept definitions may use only information that the player could perceive: animation, projectile path, position, damage numbers, health change, repeated behavior, visible status, text actually shown in battle, and encounter presentation. Internal role names, database IDs, designer tags, and future mechanics are prohibited evidence.

## Interpretation Procedure

1. Reject invisible events before concept learning.
2. Extract visible features for each observed entity across the local episode.
3. Compare those features with known concept definitions.
4. Select the most specific sufficiently supported concept. If evidence is insufficient, use a broad known concept such as `普通小怪`.
5. Replace the raw entity reference in both event subject and target with the concept reference.
6. Remove internal identity fields from the semantic event.
7. Feed only the semantic event to expectation, emotion, knowledge, attribution, and decision systems.
8. After feedback has been processed, update concept confidence and candidate counters.

Example:

```text
raw: right-3 / 路匪弓手3 casts a visible arrow attack
visible features: enemy + ordinary + ranged projectile
semantic subject: concept:enemy_minion_ranged / 远程小怪
knowledge: 远程小怪在早期主线攻击玩家队伍，造成了较高威胁
```

The player does not learn `right-3`, `路匪弓手3`, or the engine role name.

## Creating A New Concept

Do not create a concept for every unfamiliar entity. Keep the entity under a broad concept and create a candidate only when all of these are true:

- The visible pattern cannot be explained by an existing concept.
- The pattern repeats with enough evidence.
- It appears in more than one encounter context, not merely several copies in one fight.
- The distinction changes prediction or behavior, such as identifying a healer, shield source, controller, or unusual damage pattern.

Candidate states:

- `observe_more`: visible difference exists but evidence or decision value is insufficient.
- `eligible_for_review`: repeated cross-context evidence is sufficient for the cognition node to create or reject a concept.
- `accepted`: a new concept has been added with a visible definition.
- `merged`: the candidate was explained by an existing concept.

Concept creation is a cognition decision, not an engine truth dump.

## Knowledge Contract

Every learned row remains:

```text
subject + environment + behavior -> result
```

The subject and target must already be conceptized. The behavior must causally produce the result. Receiving a reward is not the cause of obtaining loot; clearing the encounter is. Obtaining an item does not increase power; explicitly equipping it may increase observed power.

## Failure Conditions

Fail the implementation if any of these occur:

- Player requests or knowledge contain disposable enemy IDs or internal names.
- Internal role strings are used as learned concepts without visible-definition matching.
- Concept matching happens after emotion or knowledge updates.
- A new concept is created from one isolated copy or a non-decision-relevant cosmetic difference.
- Raw audit events are exposed to the decision or attribution agent.

