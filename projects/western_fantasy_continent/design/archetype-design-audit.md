# Archetype Design Audit

This audit follows `skills/skill-kit-design/SKILL.md`.

Scope: current presets in `game_data/skill-assets.js`.

## Summary

| Preset | Fantasy | Formation | Core Output | Support Fit | Current Status |
| --- | --- | --- | --- | --- | --- |
| `poisonBloom` | Slow poison nest survives into detonation | Medium-high | DOT + poison ultimate | Good after class-ownership cleanup | Watch burst weakness |
| `fireBurst` | Ignite, spread, meteor finisher | Medium | Fire DOT + burst window | Good | Needs signal check for burst window timing |
| `crownCarry` | Three allies protect and accelerate one carry | High | Berserker basic windows | Good | Watch overlap with `bloodRage` |
| `ironWall` | Stand, shield, outlast, counterpush | Medium-high | Shield value + delayed skills | Good | Needs a clearer counterattack payoff later |
| `bloodRage` | Low HP danger turns into attack cadence and drain | Medium-high | Berserker basic attacks | Good | First berserker patch active |
| `lightningTempo` | Rhythm team creates repeated ranged pressure | Medium | Ranger marked attacks + haste | Good | Name is tempo, not lightning damage |
| `frostControl` | Slow front line until ranged units win | High | Control + status damage | Good | Needs signal check that slow changes target time |
| `holySustain` | Double priest shield-heal attrition | Medium | Healing/shield survival | Good | Risk of low-action stalemate |
| `shadowExecute` | Pressure low HP, then execute | Medium | Lowest-HP burst/execute | Good | Should counter fragile burst teams |
| `alchemyChaos` | Layer statuses, then amplify with mixtures | Medium | Status count payoff | Good | Needs clearer unique role between two alchemists |

## Detailed Checks

### `poisonBloom`

- Fantasy: a poison nest buys time until poison stacks and `plagueOffering` become inevitable.
- Skill volume: 7 unique small skills, 3 unique passives, 4 unique ultimates after cleanup. Medium-high complexity.
- Core skills: `venomBrand`, `miasmaFlask`, `hotbedPact`, `plagueOffering`.
- Support: knight control and priest sustain now support the slow payoff without stealing class identity.
- Expected strong matchups: `ironWall`, `holySustain`.
- Expected weak matchups: `fireBurst`, `shadowExecute`.
- Signal acceptance: poison/status tags should rise before `plagueOffering`; DOT damage share should be meaningful.

### `fireBurst`

- Fantasy: enemies are lit up, fire spreads, then meteor converts the board state into a visible burst.
- Skill volume: 6 unique small skills, 3 unique passives, 3 unique ultimates. Medium complexity.
- Core skills: `fireball`, `emberSpread`, `kindlingEcho`, `meteorRain`.
- Support: warrior/knight provide enough front time for mages to reach meteor.
- Expected strong matchups: fragile execute or low armor backline teams.
- Expected weak matchups: `ironWall`, `holySustain`.
- Signal acceptance: burn tags should precede meteor damage; meteor should show as a burst window, not random chip.

### `crownCarry`

- Fantasy: the team makes one visible hero large enough to become the win condition.
- Skill volume: 8 unique small skills, 4 unique passives, 4 unique ultimates. High commitment.
- Core skills: `courageChord`, `tempoSong`, `crescendo`, berserker basic-window kit.
- Support: bard attack tempo and priest sustain directly support a basic-attack carry.
- Expected strong matchups: slow poison/control teams if the carry survives setup.
- Expected weak matchups: hard execute or burst that kills the carry before support windows.
- Signal acceptance: carry's basic damage share should increase during bard and berserker windows.

### `ironWall`

- Fantasy: the front refuses to move, turns the fight into a long resource exchange, and wins late.
- Skill volume: 8 unique small skills, 4 unique passives, 4 unique ultimates. High commitment.
- Core skills: `guard`, `tauntLine`, `fortressStance`, `bannerWall`, `sanctuary`.
- Support: shield and heal density matches survival output.
- Expected strong matchups: `fireBurst`, `shadowExecute`.
- Expected weak matchups: `poisonBloom`, `alchemyChaos`.
- Signal acceptance: shield tags should absorb early burst; fight duration should lengthen.
- Follow-up: add a clearer counterattack or reflected-damage payoff if the team only stalls.

### `bloodRage`

- Fantasy: the berserker enters danger, does not immediately die, then attacks faster and drains back health.
- Skill volume: 8 unique small skills, 4 unique passives, 4 unique ultimates. High commitment.
- Core skills: `bloodStrike`, `boneWhirl`, `rageEngine`, `undyingRoar`, bard haste.
- Support: priest and bard directly support the low-health basic-attack plan.
- Expected strong matchups: slow shield/control teams.
- Expected weak matchups: execute and high burst before `undyingRoar`.
- Signal acceptance: health snapshots should show a low-health dip, then oscillation or recovery; basic attack cadence should rise after low-health entry.

### `lightningTempo`

- Fantasy: repeated rhythm windows let ranged units focus targets down.
- Skill volume: 6 unique small skills, 3 unique passives, 3 unique ultimates. Medium complexity.
- Core skills: `markShot`, `duelistFocus`, `tempoSong`, `crescendo`.
- Support: bard haste supports ranger primary output.
- Expected strong matchups: slow teams without backline access.
- Expected weak matchups: assassins and heavy front control.
- Signal acceptance: marked-target damage should become concentrated; haste windows should increase ranger attack events.

### `frostControl`

- Fantasy: the enemy front line is slowed long enough for status damage to build and ranged units to finish.
- Skill volume: 8 unique small skills, 4 unique passives, 4 unique ultimates. High commitment.
- Core skills: `frostNova`, `pinningArrow` if added later, `volatileBottle`, `grandMixture`.
- Support: control gives fragile casters more time, but the current team lacks a ranger slow source.
- Expected strong matchups: melee-heavy `bloodRage`, `shadowExecute`.
- Expected weak matchups: long-range fire burst and poison inevitability.
- Signal acceptance: slow/status tags should appear before damage payoff; enemy melee time-on-target should drop.

### `holySustain`

- Fantasy: double priest turns health bars into a slow, bright attrition machine.
- Skill volume: 6 unique small skills, 3 unique passives, 3 unique ultimates. Medium complexity.
- Core skills: `heal`, `bloodCharm`, `afterglowGrace`, `sanctuary`.
- Support: all support skills reinforce survival.
- Expected strong matchups: burst and execute.
- Expected weak matchups: poison, status amplification, anti-heal if added later.
- Signal acceptance: healing and shield tags should dominate; fight duration should rise without making damage disappear entirely.

### `shadowExecute`

- Fantasy: assassins push a target into danger and finish it before the enemy stabilizes.
- Skill volume: 6 unique small skills, 3 unique passives, 3 unique ultimates. Medium complexity.
- Core skills: `shadowCut`, `executionSense`, `shadowHarvest`, `bloodContract`.
- Support: warlock self-risk and buffing fits a high-pressure execute team.
- Expected strong matchups: fragile burst teams and carry teams.
- Expected weak matchups: `ironWall`, `holySustain`.
- Signal acceptance: lowest-HP targeting should concentrate damage; execute damage should convert low targets into kills.

### `alchemyChaos`

- Fantasy: statuses pile up from multiple sources, then mixtures turn the board state into damage.
- Skill volume: 6 unique small skills, 3 unique passives, 3 unique ultimates. Medium complexity.
- Core skills: `miasmaFlask`, `volatileBottle`, `catalyst`, `grandMixture`, mage burn.
- Support: knight buys time while alchemists and mage create status density.
- Expected strong matchups: `ironWall`, `holySustain`.
- Expected weak matchups: fast execute or ranged focus before status density.
- Signal acceptance: status count should precede `volatileBottle` and `grandMixture` damage.
- Follow-up: give the second alchemist an alternate small skill later so duplicate slots feel less flat.
