# Battle View Compatibility Check

Date: 2026-07-09

Scope: compatibility between `shared/game_camera_2d/` and the western-fantasy shared battle renderer at `projects/western_fantasy_continent/battle_view/battle-view.js`.

## Summary

The current shared battle code is mostly compatible with the new game-time/camera direction, but it should be integrated carefully.

Good news:

- The unified combat path already exposes `sim.update(dt)`.
- The legacy battle path already exposes `update(dt)`.
- Movement, cooldowns, DOT ticks, timers, and battle duration already advance from `dt`.

Main incompatibilities:

- The render loop currently uses `performance.now()` directly and multiplies by `this.speed`.
- VFX cleanup uses real-time `setTimeout(...)`, so slow motion would not slow labels, floaters, rings, slash images, afterimages, or beams.
- Unit and FX rendering currently writes percentage positions directly into DOM styles, not through a camera world-to-screen transform.
- CSS animations, if any, are browser-time based unless routed through classes/variables or a managed VFX lifetime system.

## Current Time Flow

`battle-view.js` currently has two runtime paths:

```text
unified path:
setInterval -> tickUnified(performance.now()) -> dt * this.speed -> sim.update(dt)

legacy path:
setInterval -> tick(performance.now()) -> dt * this.speed -> this.update(dt)
```

This means slow motion can be introduced by replacing the dt source:

```js
const time = gameTime.update(now);
const dt = Math.min(0.2, time.deltaMs / 1000);
sim.update(dt);
```

The existing `this.speed` should either be removed, mapped to `gameTime.setTimeScale(...)`, or treated as an initial/default time scale. Keeping both independent risks double-scaling.

## Current VFX Timing Risk

Current VFX methods call real-time cleanup:

- `label(...)`: `setTimeout(..., 1050 / 780)`
- `floater(...)`: `setTimeout(..., 900)`
- `ring(...)`: `setTimeout(..., 720)`
- `afterimage(...)`: `setTimeout(..., 520)`
- `slash(...)`: `setTimeout(..., 480)`
- `beam(...)`: `setTimeout(..., 360)`

These will ignore game-time slow motion. During `0.2x` slow motion, a slash would still disappear in 480 real ms instead of lasting 2.4 seconds of screen time.

Recommended fix:

```text
replace setTimeout cleanup with managed VFX objects:
{ node, remainingMs }
each frame: remainingMs -= gameTime.deltaMs
remove when remainingMs <= 0
```

## Camera Integration Risk

Current render uses percentages:

```js
style="left:${unit.x}%;top:${unit.y}%"
```

This is not necessarily wrong, but a camera layer needs a clear world-space contract:

- either treat current percent positions as world units in a 100x100 field;
- or convert battle units to a larger explicit world coordinate system.

Recommended first integration:

```text
Use current percent field as temporary world coordinates.
Create camera with worldBounds { minX: 0, minY: 0, maxX: 100, maxY: 100 }.
Render units/Fx through camera.worldToScreen({ x: unit.x, y: unit.y }).
```

This avoids changing combat movement or targeting while validating camera presentation.

## Recommended Integration Order

1. Add `game-time.js` to `battle_view` and replace `dt * this.speed` with scaled time.
2. Keep combat simulation unchanged.
3. Replace VFX `setTimeout` cleanup with scaled-time VFX lifetimes.
4. Add `camera-core.js` and `camera-modes.js` to presentation render only.
5. Convert units, labels, floaters, rings, slashes, beams, and target markers through camera world-to-screen.
6. Add `post-processing.js` after camera rendering.

## Compatibility Verdict

Compatible, but not plug-and-play.

The battle simulation is already `dt`-driven, which is the important foundation. The main work is presentation-layer cleanup: real-time VFX timers and direct DOM percentage positioning need to be routed through shared game-time and camera projection.
