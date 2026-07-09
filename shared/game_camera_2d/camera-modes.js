(function initCameraModes(root, factory) {
  const api = factory(root.AgentAutomataCamera2D || {});
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.AgentAutomataCameraModes = api;
})(typeof globalThis !== "undefined" ? globalThis : this, (cameraCore) => {
  const clamp = cameraCore.clamp || ((value, min, max) => Math.min(max, Math.max(min, value)));
  const lerp = cameraCore.lerp || ((from, to, alpha) => from + (to - from) * clamp(alpha, 0, 1));
  const boundsFromPoints = cameraCore.boundsFromPoints || ((points) => {
    if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return {
      minX: Math.min(...points.map((point) => point.x)),
      minY: Math.min(...points.map((point) => point.y)),
      maxX: Math.max(...points.map((point) => point.x)),
      maxY: Math.max(...points.map((point) => point.y)),
    };
  });

  function easeInOut(value) {
    const t = clamp(value, 0, 1);
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function normalizeArray(value) {
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
  }

  function callMaybe(value, context, mode) {
    return typeof value === "function" ? value(context, mode) : value;
  }

  function resolveModeInput(mode, context) {
    return {
      targets: normalizeArray(callMaybe(mode.targets, context, mode)).filter(Boolean),
      coordinates: normalizeArray(callMaybe(mode.coordinates, context, mode)).filter(Boolean),
      ratios: callMaybe(mode.ratios, context, mode) || {},
    };
  }

  function pointsFromTargets(targets) {
    return targets
      .filter((target) => Number.isFinite(target.x) && Number.isFinite(target.y))
      .map((target) => ({
        x: target.x,
        y: target.y,
        radius: Number.isFinite(target.radius) ? target.radius : 0,
      }));
  }

  function pointsFromCoordinates(coordinates) {
    return coordinates
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
      .map((point) => ({
        x: point.x,
        y: point.y,
        radius: Number.isFinite(point.radius) ? point.radius : 0,
      }));
  }

  function averagePoint(points, fallback = { x: 0, y: 0 }) {
    if (!points.length) return fallback;
    return {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    };
  }

  function createCameraModeController(camera, options = {}) {
    if (!camera) throw new Error("createCameraModeController requires a camera.");
    const modes = new Map();
    normalizeArray(options.modes).forEach((mode) => modes.set(mode.id, mode));

    const state = {
      currentModeId: null,
      previousModeId: null,
      transitionMs: options.transitionMs == null ? 420 : options.transitionMs,
      transitionElapsedMs: 0,
      transitionFrom: null,
      targetView: null,
    };

    function addMode(mode) {
      if (!mode?.id) throw new Error("Camera mode requires an id.");
      modes.set(mode.id, mode);
      if (!state.currentModeId) state.currentModeId = mode.id;
      return api;
    }

    function removeMode(id) {
      modes.delete(id);
      if (state.currentModeId === id) state.currentModeId = modes.keys().next().value || null;
      return api;
    }

    function setMode(id, config = {}) {
      if (!modes.has(id)) throw new Error(`Unknown camera mode: ${id}`);
      if (state.currentModeId === id && !config.force) return api;
      state.previousModeId = state.currentModeId;
      state.currentModeId = id;
      state.transitionElapsedMs = 0;
      state.transitionMs = config.transitionMs == null ? state.transitionMs : config.transitionMs;
      state.transitionFrom = camera.snapshot();
      return api;
    }

    function mode(id = state.currentModeId) {
      return id ? modes.get(id) || null : null;
    }

    function update(deltaMs = 16, context = {}) {
      const active = mode();
      if (!active) return api;
      const target = computeModeView(active, context);
      state.targetView = target;
      const smoothing = target.smoothing == null ? 1 : target.smoothing;

      if (state.transitionFrom && state.transitionElapsedMs < state.transitionMs) {
        state.transitionElapsedMs += deltaMs;
        const alpha = state.transitionMs <= 0 ? 1 : easeInOut(state.transitionElapsedMs / state.transitionMs);
        camera.moveToward({
          x: lerp(state.transitionFrom.x, target.x, alpha),
          y: lerp(state.transitionFrom.y, target.y, alpha),
          zoom: lerp(state.transitionFrom.zoom, target.zoom, alpha),
        }, 1);
      } else if (state.transitionFrom && state.transitionMs <= 0) {
        state.transitionFrom = null;
        camera.moveToward(target, 1);
      } else {
        state.transitionFrom = null;
        camera.moveToward(target, smoothing);
      }
      return api;
    }

    function computeModeView(active, context = {}) {
      if (typeof active.execute === "function") {
        const input = resolveModeInput(active, context);
        const result = active.execute({
          camera,
          context,
          mode: active,
          targets: input.targets,
          coordinates: input.coordinates,
          ratios: input.ratios,
          helpers,
        });
        return normalizeView(result, active);
      }
      return normalizeView(camera.snapshot(), active);
    }

    function normalizeView(view, active) {
      const snap = camera.snapshot();
      return {
        x: Number.isFinite(view?.x) ? view.x : snap.x,
        y: Number.isFinite(view?.y) ? view.y : snap.y,
        zoom: Number.isFinite(view?.zoom) ? view.zoom : snap.zoom,
        smoothing: Number.isFinite(view?.smoothing) ? view.smoothing : active.smoothing,
      };
    }

    function snapshot() {
      return {
        currentModeId: state.currentModeId,
        previousModeId: state.previousModeId,
        transitionMs: state.transitionMs,
        transitionElapsedMs: state.transitionElapsedMs,
        transitioning: Boolean(state.transitionFrom),
        targetView: state.targetView ? { ...state.targetView } : null,
        modes: Array.from(modes.keys()),
      };
    }

    const api = {
      state,
      addMode,
      removeMode,
      setMode,
      mode,
      update,
      computeModeView,
      snapshot,
    };

    normalizeArray(options.modes).forEach((existing) => addMode(existing));
    if (options.initialModeId) setMode(options.initialModeId, { force: true, transitionMs: 0 });
    return api;
  }

  function createKeepTargetsInViewMode(config = {}) {
    return {
      id: config.id || "keepTargetsInView",
      label: config.label || "Keep Targets In View",
      targets: config.targets || ((context) => context.targets || context.units || []),
      coordinates: config.coordinates || [],
      ratios: config.ratios || {},
      smoothing: config.smoothing == null ? 0.08 : config.smoothing,
      execute({ camera, targets, coordinates, ratios, helpers }) {
        const points = [
          ...helpers.pointsFromTargets(targets),
          ...helpers.pointsFromCoordinates(coordinates),
        ];
        if (!points.length) return camera.snapshot();
        return camera.computeFitView(helpers.boundsFromPoints(points), {
          padding: ratios.padding == null ? config.padding || 120 : ratios.padding,
          minZoom: ratios.minZoom == null ? config.minZoom || 0.5 : ratios.minZoom,
          maxZoom: ratios.maxZoom == null ? config.maxZoom || 1.4 : ratios.maxZoom,
        });
      },
    };
  }

  function createFollowTargetMode(config = {}) {
    return {
      id: config.id || "followTarget",
      label: config.label || "Follow Target",
      targets: config.targets || ((context) => context.target ? [context.target] : context.targets || []),
      coordinates: config.coordinates || [],
      ratios: config.ratios || {},
      smoothing: config.smoothing == null ? 0.1 : config.smoothing,
      execute({ camera, targets, coordinates, ratios, helpers }) {
        const points = [
          ...helpers.pointsFromTargets(targets),
          ...helpers.pointsFromCoordinates(coordinates),
        ];
        const center = helpers.averagePoint(points, camera.snapshot());
        return {
          x: center.x + (ratios.offsetX || config.offsetX || 0),
          y: center.y + (ratios.offsetY || config.offsetY || 0),
          zoom: ratios.zoom || config.zoom || camera.snapshot().zoom,
        };
      },
    };
  }

  function createFixedViewMode(config = {}) {
    return {
      id: config.id || "fixedView",
      label: config.label || "Fixed View",
      targets: config.targets || [],
      coordinates: config.coordinates || [{ x: config.x || 0, y: config.y || 0 }],
      ratios: config.ratios || {},
      smoothing: config.smoothing == null ? 0.1 : config.smoothing,
      execute({ camera, coordinates, ratios, helpers }) {
        const center = helpers.averagePoint(helpers.pointsFromCoordinates(coordinates), camera.snapshot());
        return {
          x: center.x,
          y: center.y,
          zoom: ratios.zoom || config.zoom || camera.snapshot().zoom,
        };
      },
    };
  }

  const helpers = {
    boundsFromPoints,
    pointsFromTargets,
    pointsFromCoordinates,
    averagePoint,
    clamp,
    lerp,
    easeInOut,
  };

  return {
    createCameraModeController,
    createKeepTargetsInViewMode,
    createFollowTargetMode,
    createFixedViewMode,
    helpers,
  };
});
