(function initGameTime(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.AgentAutomataGameTime = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function createGameTime(options = {}) {
    const state = {
      timeScale: options.timeScale == null ? 1 : options.timeScale,
      targetTimeScale: options.timeScale == null ? 1 : options.timeScale,
      minTimeScale: options.minTimeScale == null ? 0 : options.minTimeScale,
      maxTimeScale: options.maxTimeScale == null ? 4 : options.maxTimeScale,
      smoothing: options.smoothing == null ? 1 : options.smoothing,
      paused: Boolean(options.paused),
      elapsedMs: 0,
      realElapsedMs: 0,
      deltaMs: 0,
      realDeltaMs: 0,
      lastNowMs: null,
      temporaryScale: null,
    };

    function setTimeScale(scale, config = {}) {
      const next = clamp(scale, state.minTimeScale, state.maxTimeScale);
      state.targetTimeScale = next;
      if (config.instant !== false) {
        state.timeScale = next;
      }
      return api;
    }

    function setTemporaryTimeScale(scale, durationMs, config = {}) {
      setTimeScale(scale, config);
      state.temporaryScale = {
        remainingMs: Math.max(0, durationMs || 0),
        restoreScale: config.restoreScale == null ? 1 : config.restoreScale,
      };
      return api;
    }

    function setPaused(paused) {
      state.paused = Boolean(paused);
      state.deltaMs = 0;
      return api;
    }

    function togglePaused() {
      return setPaused(!state.paused);
    }

    function reset(nowMs = null) {
      state.elapsedMs = 0;
      state.realElapsedMs = 0;
      state.deltaMs = 0;
      state.realDeltaMs = 0;
      state.lastNowMs = nowMs;
      state.temporaryScale = null;
      return api;
    }

    function update(nowMs) {
      if (state.lastNowMs == null) {
        state.lastNowMs = nowMs;
        state.deltaMs = 0;
        state.realDeltaMs = 0;
        return snapshot();
      }

      const rawDelta = Math.max(0, nowMs - state.lastNowMs);
      state.lastNowMs = nowMs;
      state.realDeltaMs = rawDelta;
      state.realElapsedMs += rawDelta;

      if (state.temporaryScale) {
        state.temporaryScale.remainingMs -= rawDelta;
        if (state.temporaryScale.remainingMs <= 0) {
          setTimeScale(state.temporaryScale.restoreScale, { instant: false });
          state.temporaryScale = null;
        }
      }

      if (state.smoothing < 1) {
        state.timeScale += (state.targetTimeScale - state.timeScale) * clamp(state.smoothing, 0, 1);
      } else {
        state.timeScale = state.targetTimeScale;
      }

      state.deltaMs = state.paused ? 0 : rawDelta * state.timeScale;
      state.elapsedMs += state.deltaMs;
      return snapshot();
    }

    function snapshot() {
      return {
        timeScale: state.timeScale,
        targetTimeScale: state.targetTimeScale,
        paused: state.paused,
        elapsedMs: state.elapsedMs,
        realElapsedMs: state.realElapsedMs,
        deltaMs: state.deltaMs,
        realDeltaMs: state.realDeltaMs,
        temporaryScale: state.temporaryScale ? { ...state.temporaryScale } : null,
      };
    }

    const api = {
      state,
      setTimeScale,
      setTemporaryTimeScale,
      setPaused,
      togglePaused,
      reset,
      update,
      snapshot,
    };

    return api;
  }

  return {
    createGameTime,
    clamp,
  };
});
