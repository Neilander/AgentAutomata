(function initPostProcessing(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.AgentAutomataPostProcessing = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
  }

  function mix(from, to, weight) {
    return from + (to - from) * clamp(weight);
  }

  function ensureElement(parent, className) {
    const element = parent.ownerDocument.createElement("div");
    element.className = className;
    parent.appendChild(element);
    return element;
  }

  function applyBaseLayerStyle(element, zIndex) {
    Object.assign(element.style, {
      position: "absolute",
      inset: "0",
      pointerEvents: "none",
      zIndex: String(zIndex),
    });
  }

  function createPostProcessingStack(options = {}) {
    if (!options.viewport) {
      throw new Error("createPostProcessingStack requires a viewport element.");
    }

    const viewport = options.viewport;
    const contentLayer = options.contentLayer || viewport;
    const overlayRoot = ensureElement(viewport, "aa-post-processing-stack");
    applyBaseLayerStyle(overlayRoot, options.zIndex || 16);

    const colorOverlayLayer = ensureElement(overlayRoot, "aa-post-color-overlays");
    const vignetteLayer = ensureElement(overlayRoot, "aa-post-vignette");
    const flashLayer = ensureElement(overlayRoot, "aa-post-flash");
    [colorOverlayLayer, vignetteLayer, flashLayer].forEach((layer, index) => applyBaseLayerStyle(layer, index + 1));

    const state = {
      timeMs: 0,
      colorGrade: {
        enabled: true,
        weight: 0,
        brightness: 1,
        contrast: 1,
        saturate: 1,
        hueRotate: 0,
        sepia: 0,
        blur: 0,
      },
      overlays: new Map(),
      flash: null,
      vignette: {
        enabled: false,
        weight: 0,
        color: "rgba(0, 0, 0, 1)",
        size: 68,
        opacity: 0.45,
      },
      shake: null,
    };

    function setColorGrade(config = {}) {
      state.colorGrade = {
        ...state.colorGrade,
        ...config,
        weight: clamp(config.weight == null ? state.colorGrade.weight : config.weight),
      };
      render();
      return api;
    }

    function clearColorGrade() {
      state.colorGrade.weight = 0;
      render();
      return api;
    }

    function setOverlay(id, config = {}) {
      const overlay = {
        id,
        color: config.color || "rgba(255, 255, 255, 1)",
        opacity: config.opacity == null ? 0.2 : config.opacity,
        blendMode: config.blendMode || "screen",
        weight: clamp(config.weight == null ? 1 : config.weight),
        remainingMs: config.durationMs || null,
        fadeOutMs: config.fadeOutMs || Math.min(config.durationMs || 0, 240),
      };
      state.overlays.set(id, overlay);
      render();
      return api;
    }

    function removeOverlay(id) {
      state.overlays.delete(id);
      render();
      return api;
    }

    function clearOverlays() {
      state.overlays.clear();
      render();
      return api;
    }

    function setVignette(config = {}) {
      state.vignette = {
        ...state.vignette,
        ...config,
        enabled: config.enabled == null ? true : config.enabled,
        weight: clamp(config.weight == null ? 1 : config.weight),
      };
      render();
      return api;
    }

    function clearVignette() {
      state.vignette.enabled = false;
      state.vignette.weight = 0;
      render();
      return api;
    }

    function flash(config = {}) {
      state.flash = {
        color: config.color || "rgba(255, 255, 255, 1)",
        opacity: config.opacity == null ? 0.85 : config.opacity,
        durationMs: config.durationMs || 140,
        remainingMs: config.durationMs || 140,
        blendMode: config.blendMode || "screen",
      };
      render();
      return api;
    }

    function shake(config = {}) {
      state.shake = {
        intensity: config.intensity == null ? 10 : config.intensity,
        durationMs: config.durationMs || 220,
        remainingMs: config.durationMs || 220,
        frequency: config.frequency || 38,
        seed: config.seed || Math.random() * 1000,
      };
      render();
      return api;
    }

    function clearAll() {
      clearColorGrade();
      clearOverlays();
      clearVignette();
      state.flash = null;
      state.shake = null;
      render();
      return api;
    }

    function update(deltaMs = 16) {
      state.timeMs += deltaMs;
      updateTimedOverlays(deltaMs);
      updateFlash(deltaMs);
      updateShake(deltaMs);
      render();
      return api;
    }

    function updateTimedOverlays(deltaMs) {
      for (const [id, overlay] of state.overlays) {
        if (overlay.remainingMs == null) continue;
        overlay.remainingMs -= deltaMs;
        if (overlay.remainingMs <= 0) {
          state.overlays.delete(id);
        } else if (overlay.fadeOutMs > 0 && overlay.remainingMs < overlay.fadeOutMs) {
          overlay.weight = clamp(overlay.remainingMs / overlay.fadeOutMs);
        }
      }
    }

    function updateFlash(deltaMs) {
      if (!state.flash) return;
      state.flash.remainingMs -= deltaMs;
      if (state.flash.remainingMs <= 0) {
        state.flash = null;
      }
    }

    function updateShake(deltaMs) {
      if (!state.shake) return;
      state.shake.remainingMs -= deltaMs;
      if (state.shake.remainingMs <= 0) {
        state.shake = null;
        contentLayer.style.transform = "";
      }
    }

    function render() {
      renderColorGrade();
      renderOverlays();
      renderVignette();
      renderFlash();
      renderShake();
    }

    function renderColorGrade() {
      const grade = state.colorGrade;
      const weight = grade.enabled ? grade.weight : 0;
      if (weight <= 0) {
        contentLayer.style.filter = "";
        return;
      }
      const brightness = mix(1, grade.brightness, weight);
      const contrast = mix(1, grade.contrast, weight);
      const saturate = mix(1, grade.saturate, weight);
      const hueRotate = mix(0, grade.hueRotate, weight);
      const sepia = mix(0, grade.sepia, weight);
      const blur = mix(0, grade.blur, weight);
      contentLayer.style.filter = [
        `brightness(${brightness.toFixed(3)})`,
        `contrast(${contrast.toFixed(3)})`,
        `saturate(${saturate.toFixed(3)})`,
        `hue-rotate(${hueRotate.toFixed(2)}deg)`,
        `sepia(${sepia.toFixed(3)})`,
        blur > 0.001 ? `blur(${blur.toFixed(2)}px)` : "",
      ].filter(Boolean).join(" ");
    }

    function renderOverlays() {
      colorOverlayLayer.replaceChildren();
      for (const overlay of state.overlays.values()) {
        const layer = ensureElement(colorOverlayLayer, "aa-post-color-overlay");
        applyBaseLayerStyle(layer, 1);
        layer.style.background = overlay.color;
        layer.style.opacity = String(clamp(overlay.opacity * overlay.weight));
        layer.style.mixBlendMode = overlay.blendMode;
      }
    }

    function renderVignette() {
      const vignette = state.vignette;
      const active = vignette.enabled && vignette.weight > 0;
      vignetteLayer.style.opacity = active ? String(clamp(vignette.opacity * vignette.weight)) : "0";
      vignetteLayer.style.background = active
        ? `radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${vignette.size}%, ${vignette.color} 100%)`
        : "";
    }

    function renderFlash() {
      if (!state.flash) {
        flashLayer.style.opacity = "0";
        flashLayer.style.background = "";
        return;
      }
      const progress = clamp(state.flash.remainingMs / state.flash.durationMs);
      flashLayer.style.background = state.flash.color;
      flashLayer.style.opacity = String(clamp(state.flash.opacity * progress));
      flashLayer.style.mixBlendMode = state.flash.blendMode;
    }

    function renderShake() {
      if (!state.shake) return;
      const progress = clamp(state.shake.remainingMs / state.shake.durationMs);
      const strength = state.shake.intensity * progress;
      const angle = state.timeMs / Math.max(1, state.shake.frequency) + state.shake.seed;
      const x = Math.sin(angle * 1.7) * strength;
      const y = Math.cos(angle * 2.3) * strength;
      contentLayer.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
    }

    function snapshot() {
      return {
        colorGrade: { ...state.colorGrade },
        overlays: Array.from(state.overlays.values()).map((overlay) => ({ ...overlay })),
        flash: state.flash ? { ...state.flash } : null,
        vignette: { ...state.vignette },
        shake: state.shake ? { ...state.shake } : null,
      };
    }

    const api = {
      state,
      setColorGrade,
      clearColorGrade,
      setOverlay,
      removeOverlay,
      clearOverlays,
      setVignette,
      clearVignette,
      flash,
      shake,
      clearAll,
      update,
      render,
      snapshot,
    };

    render();
    return api;
  }

  return {
    createPostProcessingStack,
    clamp,
    mix,
  };
});
