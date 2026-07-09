(function initCamera2D(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.AgentAutomataCamera2D = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const EPSILON = 0.000001;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(from, to, alpha) {
    return from + (to - from) * clamp(alpha, 0, 1);
  }

  function normalizeBounds(bounds) {
    if (!bounds) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    if (Array.isArray(bounds.points)) {
      return boundsFromPoints(bounds.points);
    }
    const minX = Number.isFinite(bounds.minX) ? bounds.minX : bounds.x || 0;
    const minY = Number.isFinite(bounds.minY) ? bounds.minY : bounds.y || 0;
    const maxX = Number.isFinite(bounds.maxX) ? bounds.maxX : minX + (bounds.width || 0);
    const maxY = Number.isFinite(bounds.maxY) ? bounds.maxY : minY + (bounds.height || 0);
    return {
      minX: Math.min(minX, maxX),
      minY: Math.min(minY, maxY),
      maxX: Math.max(minX, maxX),
      maxY: Math.max(minY, maxY),
    };
  }

  function boundsFromPoints(points, padding = 0) {
    if (!points || !points.length) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    points.forEach((point) => {
      const radius = Number.isFinite(point.radius) ? point.radius : 0;
      minX = Math.min(minX, point.x - radius);
      minY = Math.min(minY, point.y - radius);
      maxX = Math.max(maxX, point.x + radius);
      maxY = Math.max(maxY, point.y + radius);
    });
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  }

  function boundsCenter(bounds) {
    const normalized = normalizeBounds(bounds);
    return {
      x: (normalized.minX + normalized.maxX) / 2,
      y: (normalized.minY + normalized.maxY) / 2,
    };
  }

  function boundsSize(bounds) {
    const normalized = normalizeBounds(bounds);
    return {
      width: Math.max(0, normalized.maxX - normalized.minX),
      height: Math.max(0, normalized.maxY - normalized.minY),
    };
  }

  function createCamera2D(options = {}) {
    const state = {
      x: options.x || 0,
      y: options.y || 0,
      zoom: options.zoom || 1,
      viewportWidth: options.viewportWidth || options.width || 1,
      viewportHeight: options.viewportHeight || options.height || 1,
      minZoom: options.minZoom || 0.2,
      maxZoom: options.maxZoom || 4,
      worldBounds: options.worldBounds ? normalizeBounds(options.worldBounds) : null,
    };

    function applyWorldBounds() {
      if (!state.worldBounds) return;
      const view = getViewBounds();
      const halfWidth = (view.maxX - view.minX) / 2;
      const halfHeight = (view.maxY - view.minY) / 2;
      const minX = state.worldBounds.minX + halfWidth;
      const maxX = state.worldBounds.maxX - halfWidth;
      const minY = state.worldBounds.minY + halfHeight;
      const maxY = state.worldBounds.maxY - halfHeight;
      state.x = minX <= maxX ? clamp(state.x, minX, maxX) : (state.worldBounds.minX + state.worldBounds.maxX) / 2;
      state.y = minY <= maxY ? clamp(state.y, minY, maxY) : (state.worldBounds.minY + state.worldBounds.maxY) / 2;
    }

    function setViewport(width, height) {
      state.viewportWidth = Math.max(EPSILON, width);
      state.viewportHeight = Math.max(EPSILON, height);
      applyWorldBounds();
      return api;
    }

    function setPosition(x, y) {
      state.x = x;
      state.y = y;
      applyWorldBounds();
      return api;
    }

    function setZoom(zoom, anchorScreenPoint) {
      const nextZoom = clamp(zoom, state.minZoom, state.maxZoom);
      if (anchorScreenPoint) {
        const before = screenToWorld(anchorScreenPoint);
        state.zoom = nextZoom;
        const after = screenToWorld(anchorScreenPoint);
        state.x += before.x - after.x;
        state.y += before.y - after.y;
      } else {
        state.zoom = nextZoom;
      }
      applyWorldBounds();
      return api;
    }

    function setWorldBounds(bounds) {
      state.worldBounds = bounds ? normalizeBounds(bounds) : null;
      applyWorldBounds();
      return api;
    }

    function worldToScreen(point) {
      return {
        x: (point.x - state.x) * state.zoom + state.viewportWidth / 2,
        y: (point.y - state.y) * state.zoom + state.viewportHeight / 2,
      };
    }

    function screenToWorld(point) {
      return {
        x: (point.x - state.viewportWidth / 2) / state.zoom + state.x,
        y: (point.y - state.viewportHeight / 2) / state.zoom + state.y,
      };
    }

    function panByScreen(deltaX, deltaY) {
      state.x -= deltaX / state.zoom;
      state.y -= deltaY / state.zoom;
      applyWorldBounds();
      return api;
    }

    function getViewBounds() {
      const halfWidth = state.viewportWidth / state.zoom / 2;
      const halfHeight = state.viewportHeight / state.zoom / 2;
      return {
        minX: state.x - halfWidth,
        minY: state.y - halfHeight,
        maxX: state.x + halfWidth,
        maxY: state.y + halfHeight,
      };
    }

    function computeFitView(bounds, options = {}) {
      const normalized = normalizeBounds(bounds);
      const padding = options.padding || 0;
      const size = boundsSize({
        minX: normalized.minX - padding,
        minY: normalized.minY - padding,
        maxX: normalized.maxX + padding,
        maxY: normalized.maxY + padding,
      });
      const zoomX = state.viewportWidth / Math.max(size.width, EPSILON);
      const zoomY = state.viewportHeight / Math.max(size.height, EPSILON);
      const targetZoom = clamp(Math.min(zoomX, zoomY), options.minZoom || state.minZoom, options.maxZoom || state.maxZoom);
      const center = boundsCenter(normalized);
      return { x: center.x, y: center.y, zoom: targetZoom };
    }

    function fitBounds(bounds, options = {}) {
      const target = computeFitView(bounds, options);
      state.x = target.x;
      state.y = target.y;
      state.zoom = target.zoom;
      applyWorldBounds();
      return api;
    }

    function moveToward(target, alpha = 1) {
      state.x = lerp(state.x, target.x, alpha);
      state.y = lerp(state.y, target.y, alpha);
      state.zoom = lerp(state.zoom, clamp(target.zoom, state.minZoom, state.maxZoom), alpha);
      applyWorldBounds();
      return api;
    }

    function followBounds(bounds, options = {}) {
      const target = computeFitView(bounds, options);
      return moveToward(target, options.smoothing == null ? 1 : options.smoothing);
    }

    function snapshot() {
      return {
        x: state.x,
        y: state.y,
        zoom: state.zoom,
        viewportWidth: state.viewportWidth,
        viewportHeight: state.viewportHeight,
        minZoom: state.minZoom,
        maxZoom: state.maxZoom,
        worldBounds: state.worldBounds ? { ...state.worldBounds } : null,
      };
    }

    const api = {
      state,
      setViewport,
      setPosition,
      setZoom,
      setWorldBounds,
      worldToScreen,
      screenToWorld,
      panByScreen,
      getViewBounds,
      computeFitView,
      fitBounds,
      moveToward,
      followBounds,
      snapshot,
    };

    setZoom(state.zoom);
    return api;
  }

  return {
    createCamera2D,
    boundsFromPoints,
    normalizeBounds,
    boundsCenter,
    boundsSize,
    clamp,
    lerp,
  };
});
