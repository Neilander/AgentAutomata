# Skill Asset Source

This directory is the source of truth for auto-battle skills.

Do not hand-edit `../skill-assets.js` for balance or skill design. That file is a browser bundle generated from these JSON assets.

## Layout

- `roles/*.json`: class/base kit assets.
- `skills/*.json`: individual skill assets. This is the closest equivalent to a Unity `ScriptableObject` skill asset.
- `presets/*.json`: 4-unit team/archetype presets.
- `models/*.json`: shared model data that multiple skills or pages read, such as the berserker basic-attack model.
- `metadata.json`: asset version and display type labels.

## Workflow

1. Edit or add JSON assets here.
2. Run:

```sh
node projects/western_fantasy_continent/game_data/build-skill-assets.js
node projects/western_fantasy_continent/game_data/validate-skill-assets.js
```

3. Pages keep loading `GAME_SKILL_DATA` through `../skill-data.js`; they do not reference individual JSON files directly.

## Skill Contract

Each skill asset should include:

```json
{
  "name": "Skill Name",
  "type": "小技能",
  "role": "Class Name",
  "cooldown": 8,
  "icon": "game-icons-id",
  "desc": "Player-facing description.",
  "effects": [
    { "kind": "hitTarget", "flat": 24, "power": 0.34, "type": "physical", "label": "Hit" }
  ]
}
```

If a design needs a new `effects[].kind`, add runtime support in `../skill-data.js` and update `../validate-skill-assets.js`.
