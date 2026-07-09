# Game Camera 2D

Reusable 2D camera module for AgentAutomata HTML games.

The module keeps combat/gameplay data in **world space** and converts it to **screen space** at render time. It must not change unit AI positions, movement rules, targeting ranges, or combat distances.

## Core Rule

```text
screenX = (worldX - camera.x) * camera.zoom + viewportWidth / 2
screenY = (worldY - camera.y) * camera.zoom + viewportHeight / 2
```

Units, projectiles, hit checks, and AI stay in world coordinates. DOM, SVG, Canvas drawing, health bars, float text, and effects use camera conversion.

## Files

- `camera-core.js`: pure JS camera logic. Works in browser and Node.
- `camera-modes.js`: reusable camera mode controller. Modes define targets, coordinates, ratios, and execution logic; switching modes lerps between views.
- `game-time.js`: reusable scaled-time controller for slow motion, pause, and temporary bullet-time style effects.
- `post-processing.js`: extensible post-processing stack for camera viewports. Works in browser and exposes testable pure helpers in Node.
- `demo/index.html`: visual proof page with moving units, auto fit, drag pan, and wheel zoom.
- `demo/demo.js`: demo behavior.
- `battle-view-compatibility.md`: notes on integrating this module with the current western-fantasy shared battle renderer.

## Basic Usage

```js
const { createCamera2D, boundsFromPoints } = AgentAutomataCamera2D;

const camera = createCamera2D({
  viewportWidth: 960,
  viewportHeight: 420,
  x: 0,
  y: 0,
  zoom: 1,
  minZoom: 0.4,
  maxZoom: 2.5,
});

const screen = camera.worldToScreen({ x: unit.x, y: unit.y });
unitEl.style.transform = `translate(${screen.x}px, ${screen.y}px)`;

const bounds = boundsFromPoints(units.map((unit) => ({ x: unit.x, y: unit.y, radius: 24 })));
camera.followBounds(bounds, { padding: 120, smoothing: 0.08 });
```

## Post Processing Stack

`post-processing.js` is a lightweight Unity-style post-processing stack for DOM-based camera viewports. It layers effects after camera projection:

```text
world -> camera transform -> fixed viewport -> post-processing stack
```

Basic setup:

```js
const { createPostProcessingStack } = AgentAutomataPostProcessing;

const post = createPostProcessingStack({
  viewport: document.querySelector("#viewport"),
  contentLayer: document.querySelector("#worldLayer"),
});

post.setColorGrade({
  weight: 1,
  brightness: 1.06,
  contrast: 1.08,
  saturate: 1.25,
  hueRotate: -8,
  sepia: 0.1,
});

post.setOverlay("poison", {
  color: "rgba(70, 255, 116, 1)",
  opacity: 0.18,
  blendMode: "screen",
});

post.setVignette({ opacity: 0.55, size: 62 });
post.flash({ color: "rgba(255, 244, 190, 1)", durationMs: 180 });
post.shake({ intensity: 18, durationMs: 360 });

function frame(deltaMs) {
  post.update(deltaMs);
}
```

Current built-in layers:

- color grade: brightness, contrast, saturation, hue rotation, sepia, blur;
- color overlays: multiple named overlay layers with blend modes;
- vignette;
- flash;
- shake.

Future layers can be added without changing battle logic, for example chromatic aberration, bloom adapters, screen distortion, hit-stop coordination, or WebGL/Canvas render passes.

## Game Time

`game-time.js` provides one shared source for scaled simulation time:

```js
const { createGameTime } = AgentAutomataGameTime;

const gameTime = createGameTime({ timeScale: 1, smoothing: 0.18 });

function frame(realNowMs) {
  const time = gameTime.update(realNowMs);
  simulation.update(time.deltaMs);
  animation.update(time.deltaMs);
  post.update(time.deltaMs);
}

gameTime.setTimeScale(0.25, { instant: false });
gameTime.setTemporaryTimeScale(0.12, 1000, { restoreScale: 1 });
gameTime.togglePaused();
```

Use scaled `deltaMs` for gameplay, cooldowns, animation, and camera motion when the whole game should slow down. UI input may still use real time so buttons remain responsive.

## Camera Modes

`camera-modes.js` provides a layer above the raw camera. A mode is a reusable camera behavior:

```js
const {
  createCameraModeController,
  createKeepTargetsInViewMode,
  createFollowTargetMode,
  createFixedViewMode,
} = AgentAutomataCameraModes;

const modes = createCameraModeController(camera, {
  transitionMs: 480,
  modes: [
    createKeepTargetsInViewMode({
      id: "all",
      targets: (context) => context.units,
      ratios: { padding: 120, minZoom: 0.6, maxZoom: 1.3 },
    }),
    createFollowTargetMode({
      id: "carry",
      targets: (context) => [context.carry],
      ratios: { zoom: 1.1, offsetX: 100 },
    }),
    createFixedViewMode({
      id: "fixed",
      coordinates: [{ x: 220, y: 0 }],
      ratios: { zoom: 0.9 },
    }),
  ],
  initialModeId: "all",
});

modes.setMode("carry");
modes.update(deltaMs, { units, carry });
```

Mode shape:

```js
{
  id: "mode-id",
  targets: (context) => [unitA, unitB],
  coordinates: (context) => [{ x: 0, y: 0 }],
  ratios: (context) => ({ padding: 120, zoom: 1.1 }),
  execute: ({ camera, targets, coordinates, ratios, helpers }) => ({ x, y, zoom })
}
```

This makes behaviors such as "keep all targets in view", "follow one role", "boss framing", "left-biased multi-wave entry", and "manual fixed view" reusable presets instead of page-specific camera hacks.

## Recommended Battle Integration

1. Keep the battle simulation unchanged.
2. Add `camera` to the battle view layer.
3. Convert every rendered world object through `worldToScreen`.
4. Convert mouse/touch input through `screenToWorld`.
5. Apply the same conversion to units, health bars, VFX anchors, hit floaters, target lines, and ground markers.

## Do Not

- Do not move all unit world coordinates to imitate camera movement.
- Do not modify AI navigation to keep units visible.
- Do not make one side faster or fixed for camera presentation.
- Do not mix world coordinates and screen coordinates in one field without naming it clearly.
- Do not let post-processing change world positions, combat timing, targeting, or hit checks.
- Do not implement slow motion by changing every unit's speed directly; route simulation through a shared scaled game-time source.
- Do not implement a one-off camera behavior inside a page when it can be expressed as a reusable camera mode.

## Steam / App Shell Compatibility

This module has no network, DOM, or build-step dependency. The core can run in browser pages, Electron, Tauri, Node tests, or future canvas/Pixi adapters.
