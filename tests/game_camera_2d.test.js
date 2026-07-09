const assert = require("assert");
const {
  createCamera2D,
  boundsFromPoints,
} = require("../shared/game_camera_2d/camera-core.js");
const {
  clamp,
  mix,
} = require("../shared/game_camera_2d/post-processing.js");
const {
  createGameTime,
} = require("../shared/game_camera_2d/game-time.js");
const {
  createCameraModeController,
  createKeepTargetsInViewMode,
  createFollowTargetMode,
  createFixedViewMode,
} = require("../shared/game_camera_2d/camera-modes.js");

function nearlyEqual(actual, expected, tolerance = 0.0001) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be close to ${expected}`);
}

const camera = createCamera2D({
  viewportWidth: 800,
  viewportHeight: 400,
  x: 100,
  y: 50,
  zoom: 2,
});

const screen = camera.worldToScreen({ x: 100, y: 50 });
assert.deepStrictEqual(screen, { x: 400, y: 200 });

const world = camera.screenToWorld({ x: 500, y: 260 });
nearlyEqual(world.x, 150);
nearlyEqual(world.y, 80);

camera.panByScreen(100, -50);
nearlyEqual(camera.snapshot().x, 50);
nearlyEqual(camera.snapshot().y, 75);

const bounds = boundsFromPoints([
  { x: -100, y: -50, radius: 20 },
  { x: 300, y: 90, radius: 10 },
], 30);
assert.deepStrictEqual(bounds, { minX: -150, minY: -100, maxX: 340, maxY: 130 });

camera.setViewport(1000, 500);
camera.fitBounds(bounds, { padding: 50, minZoom: 0.5, maxZoom: 3 });
const fit = camera.snapshot();
nearlyEqual(fit.x, 95);
nearlyEqual(fit.y, 15);
assert.ok(fit.zoom >= 0.5 && fit.zoom <= 3);

const beforeAnchor = camera.screenToWorld({ x: 250, y: 250 });
camera.setZoom(fit.zoom * 1.2, { x: 250, y: 250 });
const afterAnchor = camera.screenToWorld({ x: 250, y: 250 });
nearlyEqual(afterAnchor.x, beforeAnchor.x);
nearlyEqual(afterAnchor.y, beforeAnchor.y);

assert.strictEqual(clamp(2), 1);
assert.strictEqual(clamp(-1), 0);
nearlyEqual(mix(10, 20, 0.25), 12.5);

const gameTime = createGameTime({ timeScale: 0.5 });
gameTime.update(0);
let timeSnapshot = gameTime.update(1000);
nearlyEqual(timeSnapshot.realDeltaMs, 1000);
nearlyEqual(timeSnapshot.deltaMs, 500);
nearlyEqual(timeSnapshot.elapsedMs, 500);
gameTime.setPaused(true);
timeSnapshot = gameTime.update(1400);
nearlyEqual(timeSnapshot.deltaMs, 0);
nearlyEqual(timeSnapshot.elapsedMs, 500);
gameTime.setPaused(false).setTemporaryTimeScale(0.25, 200, { restoreScale: 1 });
timeSnapshot = gameTime.update(1500);
nearlyEqual(timeSnapshot.deltaMs, 25);

const modeCamera = createCamera2D({ viewportWidth: 800, viewportHeight: 400, x: 0, y: 0, zoom: 1, minZoom: 0.4, maxZoom: 2 });
const modeController = createCameraModeController(modeCamera, {
  transitionMs: 100,
  modes: [
    createKeepTargetsInViewMode({ id: "all", targets: (context) => context.units, ratios: { padding: 20, minZoom: 0.5, maxZoom: 2 } }),
    createFollowTargetMode({ id: "follow", targets: (context) => [context.units[0]], ratios: { zoom: 1.2, offsetX: 10 } }),
    createFixedViewMode({ id: "fixed", coordinates: [{ x: 50, y: 25 }], ratios: { zoom: 0.8 } }),
  ],
  initialModeId: "all",
});
const modeUnits = [{ x: -100, y: 0, radius: 10 }, { x: 100, y: 0, radius: 10 }];
modeController.update(16, { units: modeUnits });
assert.strictEqual(modeController.snapshot().currentModeId, "all");
modeController.setMode("follow");
modeController.update(50, { units: modeUnits });
assert.strictEqual(modeController.snapshot().previousModeId, "all");
modeController.update(60, { units: modeUnits });
const followed = modeCamera.snapshot();
assert.ok(followed.x < 0, "follow mode should move toward the first unit plus offset");
modeController.setMode("fixed", { transitionMs: 0 });
modeController.update(16, { units: modeUnits });
const fixed = modeCamera.snapshot();
nearlyEqual(fixed.x, 50, 0.5);
nearlyEqual(fixed.y, 25, 0.5);

console.log("game_camera_2d tests passed");
