(() => {
  const SLASH_BASE = "/effect_lab/assets/brackeys/particles/alpha";
  const BATTLE_VIEW_BASE = document.currentScript?.src ? new URL(".", document.currentScript.src).href : "../battle_view/";
  const NATURE_SEED_ICON = `${BATTLE_VIEW_BASE}assets/plant-seed.svg`;
  const SKILLS = window.GAME_SKILL_DATA || {};
  const SIGNALS = window.GAME_COMBAT_SIGNALS || {};
  const CAMERA_2D = window.AgentAutomataCamera2D || null;
  const CAMERA_MODES = window.AgentAutomataCameraModes || null;
  const GAME_TIME = window.AgentAutomataGameTime || null;
  const POST_PROCESSING = window.AgentAutomataPostProcessing || null;
  const SHARED_PRESENTATION_SCRIPTS = [
    "/shared/game_camera_2d/camera-core.js",
    "/shared/game_camera_2d/camera-modes.js",
    "/shared/game_camera_2d/game-time.js",
    "/shared/game_camera_2d/post-processing.js",
  ];
  let sharedPresentationPromise = null;

  function sharedPresentationReady() {
    return Boolean(
      window.AgentAutomataCamera2D?.createCamera2D &&
      window.AgentAutomataCameraModes?.createCameraModeController &&
      window.AgentAutomataGameTime?.createGameTime &&
      window.AgentAutomataPostProcessing?.createPostProcessingStack
    );
  }

  function loadSharedPresentationScripts() {
    if (sharedPresentationReady()) return Promise.resolve(true);
    if (sharedPresentationPromise) return sharedPresentationPromise;
    sharedPresentationPromise = SHARED_PRESENTATION_SCRIPTS.reduce((chain, src) => chain.then(() => new Promise((resolve) => {
      if ([...document.scripts].some((script) => script.src.endsWith(src))) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    })), Promise.resolve(true)).then(() => sharedPresentationReady());
    return sharedPresentationPromise;
  }
  const ROLE_ICONS = {
    knight: "🛡️", cavalry: "🐎", warrior: "⚔️", berserker: "🪓", assassin: "🗡️", ranger: "🏹",
    mage: "🔥", priest: "✨", warlock: "☠️", bard: "🎵", alchemist: "⚗️",
    enemy_bone_ogre: "👁️", enemy_ember_idol: "🔥", enemy_plague_totem: "☠️",
    enemy_stone_golem: "🪨", enemy_mirror_executioner: "🗡️", enemy_frost_pylon: "❄️",
  };

  function formationSlot(side, index, teamSize) {
    const compact = side === "ally"
      ? [{ x: 18, y: 36, line: "前排" }, { x: 18, y: 64, line: "前排" }, { x: 2, y: 32, line: "后排" }, { x: 2, y: 68, line: "后排" }]
      : [{ x: 82, y: 36, line: "前排" }, { x: 82, y: 64, line: "前排" }, { x: 98, y: 32, line: "后排" }, { x: 98, y: 68, line: "后排" }];
    if (teamSize <= 4) return compact[index % 4];
    const row = index % 5;
    const column = Math.floor(index / 5);
    const columnCount = Math.ceil(teamSize / 5);
    const x = side === "ally" ? 32 - column * 10 : 68 + column * 10;
    return { x, y: 18 + row * 16, line: column < Math.ceil(columnCount / 2) ? "前排" : "后排" };
  }
  const BERSERKER_MODEL = SKILLS.berserkerModel || {};
  const BERSERKER_RATIOS = BERSERKER_MODEL.ratios || {};
  const BERSERKER_DURATIONS = BERSERKER_MODEL.durations || {};
  const BERSERKER_COOLDOWNS = BERSERKER_MODEL.cooldowns || {};
  const BERSERKER_PASSIVE = BERSERKER_MODEL.passive || {};
  const SKILL_KEY_BY_NAME = Object.fromEntries(Object.entries(SKILLS.skills || {}).map(([key, skill]) => [skill.name, key]));
  Object.assign(SKILL_KEY_BY_NAME, {
    "护卫反击": "retaliationStance",
    "王旗不倒": "bannerWall",
  });

  const TIMER_ALIASES = {
    guardTimer: "guard",
    tauntTimer: "taunt",
    slowTimer: "slow",
    hasteTimer: "haste",
    undyingTimer: "immortal",
    lifeStealTimer: "lifeSteal",
    bloodFuryTimer: "bloodFury",
    whirlwindTimer: "whirlwind",
    roarFuryTimer: "roarFury",
  };

  class BattleView {
    constructor(options = {}) {
      this.container = options.container;
      this.onFinish = options.onFinish || (() => {});
      this.maxTime = options.maxTime || 70;
      this.speed = options.speed || 1;
      this.manualStart = options.manualStart === true;
      this.focusSkillFeed = options.focusSkillFeed === true;
      this.initialFocusRole = options.initialFocusRole || null;
      this.effectRoleFilter = Array.isArray(options.effectRoles) ? new Set(options.effectRoles.filter(Boolean)) : null;
      this.distanceRuler = options.distanceRuler || null;
      this.presentationOptions = {
        camera: options.camera !== false,
        gameTime: options.gameTime !== false,
        postProcessing: options.postProcessing !== false,
        cameraMode: options.cameraMode || "fixed",
        cameraSmoothing: options.cameraSmoothing ?? 0.075,
      };
      this.state = {
        running: false,
        time: 0,
        lastFrame: 0,
        units: [],
        logs: [],
        result: null,
        raf: 0,
        signalBus: SIGNALS.createCombatSignalBus ? SIGNALS.createCombatSignalBus() : null,
        vfxNodes: [],
        camera: null,
        cameraModes: null,
        gameTime: null,
        postStack: null,
        unifiedAccumulator: 0,
        pendingStart: false,
        focusedUnitId: null,
        focusNoticeTimers: [],
      };
      this.sharedSkills = SKILLS.createSkillLibrary ? SKILLS.createSkillLibrary(this.skillApi()) : {};
      this.mount();
    }

    mount() {
      if (!this.container) throw new Error("BattleView requires a container.");
      this.container.__battleView = this;
      window.__latestBattleView = this;
      this.container.innerHTML = `
        <section class="battle-view ${this.focusSkillFeed ? "battle-focus-enabled" : ""}">
          <div class="battle-view-scoreboard">
            <div><span>我方存活</span><strong data-battle-left>0</strong></div>
            <div class="battle-score-center">
              <span data-battle-state>待命</span><strong data-battle-time>0.0s</strong>
              <button type="button" class="battle-start-button" data-battle-start hidden>开始战斗</button>
            </div>
            <div><span>敌方存活</span><strong data-battle-right>0</strong></div>
          </div>
          <div class="battle-view-field" data-battle-field>
            <span class="battle-side-label left">我方阵线</span>
            <span class="battle-side-label right">敌方阵线</span>
            ${this.focusSkillFeed ? '<div class="battle-focus-hint" data-battle-focus-hint>点击任意单位关注技能</div><div class="battle-focus-feed" data-battle-focus-feed aria-live="polite" aria-label="关注单位技能提示"></div>' : ""}
            ${this.distanceRulerHtml()}
            <div class="battle-camera-world" data-battle-world>
              <div class="battle-fx-layer" data-battle-fx></div>
              <div class="battle-unit-layer" data-battle-units></div>
            </div>
          </div>
          <div class="battle-view-log" data-battle-log></div>
        </section>
      `;
      this.els = {
        left: this.container.querySelector("[data-battle-left]"),
        right: this.container.querySelector("[data-battle-right]"),
        state: this.container.querySelector("[data-battle-state]"),
        time: this.container.querySelector("[data-battle-time]"),
        startButton: this.container.querySelector("[data-battle-start]"),
        field: this.container.querySelector("[data-battle-field]"),
        worldLayer: this.container.querySelector("[data-battle-world]"),
        unitLayer: this.container.querySelector("[data-battle-units]"),
        fxLayer: this.container.querySelector("[data-battle-fx]"),
        log: this.container.querySelector("[data-battle-log]"),
        distanceStatus: this.container.querySelector("[data-distance-status]"),
        distanceProgress: this.container.querySelector("[data-distance-progress]"),
        focusHint: this.container.querySelector("[data-battle-focus-hint]"),
        focusFeed: this.container.querySelector("[data-battle-focus-feed]"),
      };
      this.els.startButton?.addEventListener("click", () => this.beginManualBattle());
      this.els.unitLayer?.addEventListener("pointerdown", (event) => {
        const unitNode = event.target.closest?.("[data-battle-unit-id]");
        if (unitNode) this.setFocusedUnit(unitNode.dataset.battleUnitId);
      });
      this.els.unitLayer?.addEventListener("keydown", (event) => {
        if (!['Enter', ' '].includes(event.key)) return;
        const unitNode = event.target.closest?.("[data-battle-unit-id]");
        if (!unitNode) return;
        event.preventDefault();
        this.setFocusedUnit(unitNode.dataset.battleUnitId);
      });
      this.setupPresentationRuntime();
      this.render();
    }

    distanceRulerHtml() {
      if (!this.distanceRuler) return "";
      const originX = Math.max(0, Math.min(100, Number(this.distanceRuler.originX) || 0));
      const maxDistance = Math.max(1, Math.min(100 - originX, Number(this.distanceRuler.maxDistance) || (100 - originX)));
      const step = Math.max(1, Number(this.distanceRuler.step) || 4);
      const labelStep = Math.max(step, Number(this.distanceRuler.labelStep) || 8);
      const threshold = Math.max(0, Number(this.distanceRuler.threshold) || 0);
      const ticks = [];
      for (let distance = 0; distance <= maxDistance + 1e-9; distance += step) {
        const major = distance % labelStep === 0;
        const thresholdTick = Math.abs(distance - threshold) < 1e-9;
        ticks.push(`<span class="battle-distance-tick ${major ? "major" : ""} ${thresholdTick ? "threshold" : ""}" style="left:${distance / maxDistance * 100}%">${major ? `<b>${distance}</b>` : ""}${thresholdTick ? `<em>六件套门槛</em>` : ""}</span>`);
      }
      if (maxDistance % labelStep !== 0) ticks.push(`<span class="battle-distance-tick major" style="left:100%"><b>${maxDistance}</b></span>`);
      return `<div class="battle-distance-status" data-distance-status>连续移动 0.0 / ${threshold}</div><div class="battle-distance-ruler" style="--ruler-left:${originX}%;--ruler-width:${maxDistance}%"><span class="battle-distance-progress" data-distance-progress></span>${ticks.join("")}</div>`;
    }

    renderDistanceRuler() {
      if (!this.distanceRuler || !this.els?.distanceStatus || !this.els?.distanceProgress) return;
      const trackedRole = this.distanceRuler.trackedRole || "cavalry";
      const unit = this.state.units.find((entry) => entry.side === "ally" && entry.roleKey === trackedRole);
      const threshold = Math.max(1, Number(this.distanceRuler.threshold) || 16);
      const maxDistance = Math.max(threshold, Number(this.distanceRuler.maxDistance) || threshold);
      const progress = Math.max(0, Number(unit?.cavalryDistance) || 0);
      const ready = Boolean(unit?.cavalryChargeReady);
      this.els.distanceStatus.textContent = ready ? `冲锋就绪 · 连续移动 ${progress.toFixed(1)}` : `连续移动 ${Math.min(progress, threshold).toFixed(1)} / ${threshold}`;
      this.els.distanceStatus.classList.toggle("ready", ready);
      this.els.distanceProgress.style.width = `${Math.min(100, progress / maxDistance * 100)}%`;
      this.els.distanceProgress.classList.toggle("ready", ready);
    }

    setupPresentationRuntime() {
      if (!this.els?.field) return;
      if (this.state.presentationLoading) return;
      const camera2D = window.AgentAutomataCamera2D || CAMERA_2D;
      const cameraModes = window.AgentAutomataCameraModes || CAMERA_MODES;
      const gameTime = window.AgentAutomataGameTime || GAME_TIME;
      const postProcessing = window.AgentAutomataPostProcessing || POST_PROCESSING;
      if (!sharedPresentationReady() && (this.presentationOptions.camera || this.presentationOptions.gameTime || this.presentationOptions.postProcessing)) {
        this.state.presentationLoading = true;
        loadSharedPresentationScripts().then((ready) => {
          this.state.presentationLoading = false;
          if (ready && this.els?.field && !this.state.camera && !this.state.gameTime && !this.state.postStack) {
            this.setupPresentationRuntime();
            this.render();
          }
        });
        return;
      }
      const rect = this.els.field.getBoundingClientRect();
      const width = Math.max(1, rect.width || this.els.field.clientWidth || 800);
      const height = Math.max(1, rect.height || this.els.field.clientHeight || 360);
      const baseZoom = this.baseCameraZoom(width, height);
      const worldBounds = this.battleWorldBounds(width, height);

      if (!this.state.camera && this.presentationOptions.camera && camera2D?.createCamera2D && cameraModes?.createCameraModeController) {
        this.state.camera = camera2D.createCamera2D({
          x: (worldBounds.maxX - worldBounds.minX) / 2,
          y: 50,
          zoom: baseZoom * 0.92,
          minZoom: baseZoom * 0.68,
          maxZoom: baseZoom * 1.22,
          viewportWidth: width,
          viewportHeight: height,
          worldBounds,
        });
        this.setFixedBattleCamera(width, height);
        this.container.classList.add("battle-camera-enabled");
      }

      if (!this.state.gameTime && this.presentationOptions.gameTime && gameTime?.createGameTime) {
        this.state.gameTime = gameTime.createGameTime({
          timeScale: this.speed,
          minTimeScale: 0,
          maxTimeScale: 6,
          smoothing: 1,
        });
      }

      if (!this.state.postStack && this.presentationOptions.postProcessing && postProcessing?.createPostProcessingStack) {
        this.state.postStack = postProcessing.createPostProcessingStack({
          viewport: this.els.field,
          contentLayer: this.els.worldLayer,
          zIndex: 8,
        });
      }
    }

    resetPresentationClock(now = performance.now()) {
      if (this.state.gameTime) {
        this.state.gameTime.setTimeScale(this.speed, { instant: true });
        this.state.gameTime.reset(now);
      }
      this.state.lastFrame = now;
    }

    frameDelta(now) {
      if (this.state.gameTime) {
        this.state.gameTime.setTimeScale(this.speed, { instant: true });
        const snapshot = this.state.gameTime.update(now);
        return Math.min(0.2, (snapshot.deltaMs || 16 * this.speed) / 1000);
      }
      const dt = Math.min(0.2, ((now - this.state.lastFrame) / 1000 || 0.016)) * this.speed;
      this.state.lastFrame = now;
      return dt;
    }

    updatePresentation(dt) {
      this.syncPresentationViewport();
      if (this.presentationOptions.cameraMode === "fitUnits") {
        this.followUnitBounds();
      }
      this.state.postStack?.update?.(dt * 1000);
      this.updateVfxNodes(dt);
    }

    syncPresentationViewport() {
      if (!this.state.camera || !this.els?.field) return;
      const rect = this.els.field.getBoundingClientRect();
      const width = Math.max(1, rect.width || this.els.field.clientWidth || 800);
      const height = Math.max(1, rect.height || this.els.field.clientHeight || 360);
      this.state.camera.setViewport(width, height);
      this.state.camera.setWorldBounds(this.battleWorldBounds(width, height));
      if (this.presentationOptions.cameraMode !== "fitUnits") this.setFixedBattleCamera(width, height);
    }

    baseCameraZoom(width, height) {
      return Math.max(1, Math.min(width, height) / 100);
    }

    setFixedBattleCamera(width, height) {
      if (!this.state.camera) return;
      const worldBounds = this.battleWorldBounds(width, height);
      this.state.camera
        .setPosition((worldBounds.minX + worldBounds.maxX) / 2, 50)
        .setZoom(this.baseCameraZoom(width, height) * 0.92);
    }

    followUnitBounds() {
      if (!this.state.camera || !this.state.units.length) return;
      const activeUnits = this.state.units.filter((unit) => this.alive(unit));
      if (!activeUnits.length) return;
      const points = activeUnits.map((unit) => ({
        ...this.battleWorldPoint(unit),
        radius: unit.unitKind === "militia" ? 4 : 5.5,
      }));
      this.state.camera.followBounds({ points }, {
        padding: 16,
        minZoom: this.baseCameraZoom(this.state.camera.snapshot().viewportWidth, this.state.camera.snapshot().viewportHeight) * 0.72,
        maxZoom: this.baseCameraZoom(this.state.camera.snapshot().viewportWidth, this.state.camera.snapshot().viewportHeight) * 1.18,
        smoothing: this.presentationOptions.cameraSmoothing,
      });
    }

    battleAspect(width, height) {
      return Math.max(1, width / Math.max(1, height));
    }

    battleWorldBounds(width, height) {
      return { minX: 0, minY: 0, maxX: 100 * this.battleAspect(width, height), maxY: 100 };
    }

    battleWorldPoint(point) {
      const snapshot = this.state.camera?.snapshot?.();
      const width = snapshot?.viewportWidth || this.els?.field?.clientWidth || 800;
      const height = snapshot?.viewportHeight || this.els?.field?.clientHeight || 360;
      return {
        x: point.x * this.battleAspect(width, height),
        y: point.y,
      };
    }

    visualCameraScale(minScale = 0.76, maxScale = 1.42) {
      if (!this.state.camera || !this.els?.field) return 1;
      const snapshot = this.state.camera.snapshot();
      const baseZoom = this.baseCameraZoom(snapshot.viewportWidth || this.els.field.clientWidth || 800, snapshot.viewportHeight || this.els.field.clientHeight || 360);
      return Math.max(minScale, Math.min(maxScale, snapshot.zoom / Math.max(1, baseZoom)));
    }

    unitCameraScale() {
      return this.visualCameraScale(0.82, 1.08);
    }

    effectCameraScale() {
      return this.visualCameraScale(0.8, 1.28);
    }

    pointStyle(point, yOffset = 0) {
      if (this.state.camera) {
        const screen = this.state.camera.worldToScreen(this.battleWorldPoint({ x: point.x, y: point.y + yOffset }));
        return `left:0;top:0;transform:translate(${screen.x}px, ${screen.y}px) translate(-50%, -50%) scale(${this.unitCameraScale().toFixed(3)})`;
      }
      return `left:${point.x}%;top:${point.y + yOffset}%`;
    }

    placeNode(node, point, yOffset = 0, transformSuffix = "") {
      if (this.state.camera) {
        const screen = this.state.camera.worldToScreen(this.battleWorldPoint({ x: point.x, y: point.y + yOffset }));
        node.style.left = `${screen.x}px`;
        node.style.top = `${screen.y}px`;
        if (transformSuffix) node.style.transform = `translate(-50%, -50%)${transformSuffix}`;
      } else {
        node.style.left = `${point.x}%`;
        node.style.top = `${point.y + yOffset}%`;
        if (transformSuffix) node.style.transform = `translate(-50%, -50%)${transformSuffix}`;
      }
    }

    nodeDistance(a, b) {
      if (this.state.camera) {
        const from = this.state.camera.worldToScreen(this.battleWorldPoint(a));
        const to = this.state.camera.worldToScreen(this.battleWorldPoint(b));
        return Math.hypot(to.x - from.x, to.y - from.y);
      }
      return this.dist(a, b);
    }

    nodeAngle(a, b) {
      if (this.state.camera) {
        const from = this.state.camera.worldToScreen(this.battleWorldPoint(a));
        const to = this.state.camera.worldToScreen(this.battleWorldPoint(b));
        return Math.atan2(to.y - from.y, to.x - from.x);
      }
      return Math.atan2(b.y - a.y, b.x - a.x);
    }

    removeNodeLater(node, durationMs) {
      if (!node) return;
      if (!this.state.gameTime) {
        setTimeout(() => node.remove(), durationMs);
        return;
      }
      this.state.vfxNodes.push({ node, remainingMs: durationMs });
    }

    updateVfxNodes(dt) {
      if (!this.state.vfxNodes.length) return;
      const next = [];
      for (const item of this.state.vfxNodes) {
        item.remainingMs -= dt * 1000;
        if (item.remainingMs <= 0 || !item.node.isConnected) item.node.remove();
        else next.push(item);
      }
      this.state.vfxNodes = next;
    }

    start({ leftTeam = [], rightTeam = [], seed = "battle-view", title = "战斗", randomizeStats, fieldEffectId } = {}) {
      if (window.GAME_COMBAT_SIM?.CombatSimulation) {
        this.startUnified({ leftTeam, rightTeam, seed, title, randomizeStats, fieldEffectId });
        return;
      }
      throw new Error("共享战斗模拟器没有加载，已拒绝启动旧备用战斗。");
    }

    preview({ leftTeam = [], rightTeam = [], title = "预览" } = {}) {
      this.stop(false);
      this.state.time = 0;
      this.state.result = null;
      this.state.logs = leftTeam.length || rightTeam.length ? [`${title}阵容预览。`] : [];
      this.state.signalBus?.clear();
      this.state.units = [
        ...this.makeUnits("ally", leftTeam),
        ...this.makeUnits("enemy", rightTeam),
      ];
      this.render();
    }

    startUnified({ leftTeam = [], rightTeam = [], seed = "battle-view", title = "\u6218\u6597", randomizeStats, fieldEffectId } = {}) {
      if (!window.GAME_COMBAT_SIM?.CombatSimulation) {
        throw new Error("共享战斗模拟器没有加载，无法启动战斗。");
      }
      this.stop(false);
      const sim = new window.GAME_COMBAT_SIM.CombatSimulation({
        seed,
        maxTime: this.maxTime,
        healthInterval: 0.5,
        randomizeStats,
        fieldEffectId,
      });
      sim.time = 0;
      sim.nextId = 1;
      sim.logs = [];
      sim.signalBus.clear();
      sim.units = [...sim.makeTeam("left", leftTeam), ...sim.makeTeam("right", rightTeam)];
      if (sim.randomizeStats) sim.applyStatSwing();
      sim.runtimeField?.setup?.();

      this.state.time = 0;
      this.state.result = null;
      this.state.logs = [this.manualStart ? `${title}已就绪。选择关注单位后开始战斗。` : `${title}\u5f00\u59cb\u3002`];
      this.state.signalBus?.clear();
      this.state.units = [
        ...this.makeUnits("ally", leftTeam),
        ...this.makeUnits("enemy", rightTeam),
      ];
      this.state.unifiedSim = sim;
      this.state.unifiedAccumulator = 0;
      this.state.lastSignalIndex = 0;
      this.state.pendingStart = this.manualStart;
      this.state.running = !this.manualStart;
      this.state.battleTitle = title;
      this.state.focusedUnitId = null;
      this.state.seed = seed;
      this.syncUnifiedUnits();
      if (this.focusSkillFeed && this.initialFocusRole) {
        const initialFocus = this.state.units.find((unit) => unit.side === "ally" && (unit.roleKey || unit.role) === this.initialFocusRole);
        if (initialFocus) this.state.focusedUnitId = initialFocus.unitId;
      }
      this.render();
      if (this.state.running) {
        this.resetPresentationClock(performance.now());
        this.state.raf = setInterval(() => this.tickUnified(performance.now()), 33);
      }
    }

    beginManualBattle() {
      if (!this.state.pendingStart || !this.state.unifiedSim) return false;
      this.state.pendingStart = false;
      this.state.running = true;
      this.state.logs.unshift(`${this.state.battleTitle || "战斗"}开始。`);
      this.resetPresentationClock(performance.now());
      this.state.raf = setInterval(() => this.tickUnified(performance.now()), 33);
      this.render();
      return true;
    }

    addUnifiedReinforcements(side, specs = [], title = "增援") {
      const sim = this.state.unifiedSim;
      if (!sim || !specs.length || !["left", "right"].includes(side)) return [];
      const nextIndex = sim.units
        .filter((unit) => unit.side === side)
        .reduce((max, unit) => Math.max(max, Number(unit.index) + 1 || 0), 0);
      const incoming = sim.makeTeam(side, specs);
      incoming.forEach((unit, index) => {
        unit.index = nextIndex + index;
        unit.id = `${side}-${unit.index + 1}`;
      });
      sim.units.push(...incoming);

      const displaySide = side === "left" ? "ally" : "enemy";
      const displayUnits = this.makeUnits(displaySide, specs);
      displayUnits.forEach((unit, index) => {
        const combatUnit = incoming[index];
        unit.unitId = `${displaySide}_${combatUnit.index}`;
        unit.id = unit.unitId;
        unit.simId = combatUnit.id;
      });
      this.state.units.push(...displayUnits);
      this.state.result = null;
      this.state.logs.unshift(`${title}进场。`);
      if (!this.state.running && !this.state.pendingStart && sim.units.some((unit) => unit.side !== side && sim.isAlive(unit))) {
        this.state.running = true;
        this.resetPresentationClock(performance.now());
        this.state.raf = setInterval(() => this.tickUnified(performance.now()), 33);
      }
      this.syncUnifiedUnits();
      this.render();
      return incoming;
    }

    tickUnified(now) {
      const sim = this.state.unifiedSim;
      if (!this.state.running || !sim) return;
      const frameDt = this.frameDelta(now);
      const fixedDt = Math.max(0.001, Number(sim.dt) || 0.08);
      this.state.unifiedAccumulator = Math.min(
        fixedDt * 8,
        this.state.unifiedAccumulator + frameDt,
      );
      while (this.state.unifiedAccumulator >= fixedDt && sim.time < this.maxTime) {
        sim.update(fixedDt);
        this.state.unifiedAccumulator -= fixedDt;
        const leftAlive = sim.units.some((unit) => unit.side === "left" && sim.isAlive(unit));
        const rightAlive = sim.units.some((unit) => unit.side === "right" && sim.isAlive(unit));
        if (!leftAlive || !rightAlive) break;
      }
      this.state.time = sim.time;
      this.syncUnifiedUnits();
      this.playUnifiedSignals();
      this.finishUnifiedIfNeeded();
      this.updatePresentation(frameDt);
      this.render();
    }

    syncUnifiedUnits() {
      const sim = this.state.unifiedSim;
      if (!sim) return;
      const sideMap = { left: "ally", right: "enemy" };
      for (const combatUnit of sim.units || []) {
        const unit = this.state.units.find((item) => item.simId === combatUnit.id)
          || this.state.units.find((item) => item.side === sideMap[combatUnit.side] && item.unitId.endsWith(`_${combatUnit.index}`));
        if (!unit) continue;
        unit.x = combatUnit.x;
        unit.y = combatUnit.y;
        unit.maxHp = combatUnit.maxHp;
        unit.hpNow = Math.max(0, combatUnit.hp);
        unit.shield = combatUnit.shield || 0;
        unit.simId = combatUnit.id;
        unit.deadTriggered = !sim.isAlive(combatUnit);
        unit.damageDone = combatUnit.damageDone || 0;
        unit.hiddenTimer = combatUnit.hiddenTimer || 0;
        unit.guardTimer = combatUnit.guardTimer || 0;
        unit.forcedTargetId = combatUnit.forcedTargetId || null;
        unit.natureSeeds = structuredClone(combatUnit.natureSeeds || {});
        unit.cavalryDistance = combatUnit.cavalryDistance || 0;
        unit.cavalryChargeReady = Boolean(combatUnit.cavalryChargeReady);
      }
    }

    playUnifiedSignals() {
      const sim = this.state.unifiedSim;
      if (!sim) return;
      const signals = sim.signalBus.signals || [];
      const start = this.state.lastSignalIndex || 0;
      for (const signal of signals.slice(start)) this.playUnifiedSignal(signal);
      this.state.lastSignalIndex = signals.length;
    }

    playUnifiedSignal(signal) {
      const source = this.displayUnitForRef(signal.source);
      const target = this.displayUnitForRef(signal.target);
      this.queueFocusedSignal(signal, source, target);
      const presentation = SIGNALS.describePresentation?.(signal);
      if (presentation && !presentation.visible) return;
      if (!presentation && signal.kind === "health") return;
      if (!this.effectVisibleForSignal(signal, source, target)) return;
      const tags = signal.tags || [];
      const amount = Math.round(signal.amount || 0);
      if (signal.kind === "skill") {
        if (source) this.label(source, signal.skillName || signal.skillKey || "\u6280\u80fd", tags.includes("ultimate"));
        this.playSkillFx(signal, source, target);
        return;
      }
      if (signal.kind === "damage") {
        if (target && amount > 0) {
          const cls = tags.includes("burn") || tags.includes("fire") ? "fire" : tags.includes("poison") ? "poison" : "";
          const prefix = tags.includes("burn") ? "\u71c3\u70e7-" : tags.includes("poison") ? "\u5267\u6bd2-" : "-";
          this.floater(target, `${prefix}${amount}`, cls);
          if (signal.skillKey === "meteorRain" || signal.skillName === "流星") {
            this.meteorImpactFx(target);
          } else if (tags.includes("cavalry") && tags.includes("leap")) {
            // The landing signal owns the impact silhouette; damage only supplies the number.
          } else if (this.isResidualFireSignal(signal)) {
            this.ring(target, "fire");
          } else if (source && !tags.includes("dot") && !tags.includes("selfCost")) {
            this.slash(source, target, cls === "poison" ? "poison" : cls === "fire" ? "fire" : "gold");
          }
        }
        return;
      }
      if (signal.kind === "heal") {
        if (target && amount > 0) {
          this.floater(target, `\u6cbb\u7597+${amount}`, "heal");
          if (signal.skillKey !== "sanctuary") this.ring(target, "green");
        }
        return;
      }
      if (signal.kind === "shield") {
        if (target && amount > 0) {
          this.floater(target, `\u62a4\u76fe+${amount}`, "shield");
          if (signal.skillKey === "sanctuary") this.priestBlessingFx(source, target);
          else this.ring(target, "blue");
        }
        return;
      }
      if (signal.kind === "movement") {
        if (!source) return;
        if (tags.includes("cavalry") && tags.includes("leap")) {
          this.cavalryLeapFx(signal.meta?.before, source, signal.meta?.landing || 1);
        } else if (tags.includes("cavalryCharge") && tags.includes("breakthrough")) {
          this.afterimage(signal.meta?.start || signal.meta?.before, source, "gold");
          this.floater(source, "冲锋突破", "");
          this.ring(source, "gold");
          if (target) this.slash(source, target, "gold");
        } else if (tags.includes("shadowReset")) {
          this.afterimage(signal.meta?.before, source, "purple");
          this.floater(source, "转火", "purple");
          this.ring(source, "purple");
          if (target) this.slash(source, target, "purple");
        } else if (tags.includes("shadowStep") || tags.includes("hidden")) {
          this.afterimage(signal.meta?.before, source, "purple");
          this.floater(source, "隐身", "purple");
          this.ring(source, "purple");
          if (target) this.slash(source, target, "purple");
        } else if (tags.includes("blink")) {
          this.afterimage(signal.meta?.before, source, "blue");
          if (target) this.slash(source, target, "blue");
        }
        return;
      }
      if (signal.kind === "status") {
        if (!target) return;
        if (tags.includes("cavalryCharge") && tags.includes("chargeReady")) {
          this.floater(target, "冲锋就绪", "");
          this.ring(target, "gold");
        } else if (tags.includes("natureSeed")) {
          const action = tags.includes("seedPlant") ? "plant" : tags.includes("seedGrow") ? "grow" : tags.includes("seedSpread") ? "spread" : "bloom";
          const labels = { plant: "播种", grow: `生长 ${amount}/3`, spread: "传播", bloom: "绽放" };
          this.floater(target, labels[action], "nature");
          this.natureSeedFx(target, action);
          if (action === "spread") {
            const origin = this.displayUnitForRef(signal.meta?.origin);
            if (origin) this.beam(origin, target, "green");
          }
        } else if (tags.includes("burn")) {
          this.floater(target, `\u71c3\u70e7+${amount}`, "fire");
          if (signal.skillKey !== "meteorRain") this.ring(target, "fire");
        } else if (tags.includes("poison")) {
          this.floater(target, `\u5267\u6bd2+${amount}`, "poison");
          this.ring(target, "poison");
        } else if (tags.includes("hidden")) {
          this.floater(target, tags.includes("extend") ? "续隐" : "隐身", "purple");
          this.ring(target, "purple");
        } else if (tags.includes("mark")) {
          this.floater(target, `猎标+${amount}`, "purple");
          this.ring(target, "purple");
        } else {
          this.ring(target, "gold");
        }
        return;
      }
      if (signal.kind === "field") {
        const anchorUnit = source || target;
        if (!anchorUnit) return;
        this.floater(anchorUnit, signal.text || signal.skillName || "场地效果", "gold");
        this.ring(anchorUnit, "gold");
        return;
      }
      if (signal.kind === "death" && target) this.floater(target, "\u5012\u4e0b", "");
    }

    focusedUnit() {
      return this.state.units.find((unit) => unit.unitId === this.state.focusedUnitId) || null;
    }

    setFocusedUnit(unitId) {
      if (!this.focusSkillFeed) return false;
      const unit = this.state.units.find((entry) => entry.unitId === unitId);
      if (!unit) return false;
      if (this.state.focusedUnitId === unit.unitId) {
        this.state.focusedUnitId = null;
        this.clearFocusNotices();
        this.render();
        return true;
      }
      if (this.state.focusedUnitId !== unit.unitId) this.clearFocusNotices();
      this.state.focusedUnitId = unit.unitId;
      this.render();
      return true;
    }

    focusedNoticeForSignal(signal, source, target) {
      const focused = this.focusedUnit();
      if (!focused) return null;
      const tags = signal.tags || [];
      const sourceFocused = source?.unitId === focused.unitId;
      const targetFocused = target?.unitId === focused.unitId;
      if (signal.kind === "skill" && sourceFocused) {
        return {
          title: signal.skillName || signal.skillKey || "技能",
          type: tags.includes("ultimate") ? "大招" : "小技能",
          tone: tags.includes("ultimate") ? "ultimate" : "skill",
        };
      }
      if (!sourceFocused && !(targetFocused && (tags.includes("chargeIntercept") || tags.includes("deathPrevent")))) return null;
      if (tags.includes("chargeIntercept")) return { title: targetFocused ? "冲锋被截断" : (signal.skillName || "叹息之墙·截断"), type: "关键效果", tone: "danger" };
      if (tags.includes("deathPrevent")) return { title: signal.skillName || "濒死保命", type: "关键效果", tone: "danger" };
      if (tags.includes("chargeReady")) return { title: signal.skillName || "冲锋就绪", type: tags.includes("passive") ? "被动" : "套装效果", tone: "effect" };
      if (tags.includes("breakthrough")) return { title: signal.skillName || "冲锋突破", type: "套装效果", tone: "effect" };
      if (tags.includes("shadowReset")) return { title: signal.skillName || "击杀转火", type: "被动", tone: "effect" };
      if (tags.includes("seedBloom") || tags.includes("seedSpread")) return { title: signal.skillName || (tags.includes("seedBloom") ? "繁生绽放" : "繁生传播"), type: "套装效果", tone: "effect" };
      if (tags.includes("guardianEcho") && tags.includes("echoProc")) return { title: signal.skillName || "护佑回响", type: "套装效果", tone: "effect" };
      if (tags.includes("sighingWall") && tags.includes("wallPulse")) return { title: signal.skillName || "叹息之墙", type: "套装效果", tone: "effect" };
      if (tags.includes("meteorWarning") && Number(signal.meta?.index || 1) === 1) return { title: "流星火雨", type: "套装效果", tone: "ultimate" };
      if (tags.includes("skyArrowWarning")) return { title: "天穹之箭·锁定", type: "套装效果", tone: "ultimate" };
      return null;
    }

    queueFocusedSignal(signal, source, target) {
      if (!this.focusSkillFeed || !this.els?.focusFeed) return;
      const notice = this.focusedNoticeForSignal(signal, source, target);
      const focused = this.focusedUnit();
      if (!notice || !focused) return;
      this.els.focusFeed.classList.toggle("side-left", focused.side === "ally");
      this.els.focusFeed.classList.toggle("side-right", focused.side === "enemy");
      const node = document.createElement("article");
      node.className = `battle-focus-notice tone-${notice.tone}`;
      const meta = document.createElement("small");
      meta.textContent = `${focused.name} · ${notice.type}`;
      const title = document.createElement("strong");
      title.textContent = notice.title;
      node.append(meta, title);
      this.els.focusFeed.prepend(node);
      [...this.els.focusFeed.children].slice(4).forEach((entry) => this.dismissFocusNotice(entry));
      this.scheduleFocusNotice(() => this.dismissFocusNotice(node), notice.tone === "ultimate" ? 2800 : 2200);
    }

    scheduleFocusNotice(callback, delay) {
      const timer = window.setTimeout(() => {
        this.state.focusNoticeTimers = this.state.focusNoticeTimers.filter((entry) => entry !== timer);
        callback();
      }, delay);
      this.state.focusNoticeTimers.push(timer);
    }

    dismissFocusNotice(node) {
      if (!node?.isConnected || node.classList.contains("leaving")) return;
      node.classList.add("leaving");
      this.scheduleFocusNotice(() => node.remove(), 260);
    }

    clearFocusNotices() {
      this.state.focusNoticeTimers.forEach((timer) => window.clearTimeout(timer));
      this.state.focusNoticeTimers = [];
      this.els?.focusFeed?.replaceChildren();
    }

    effectVisibleForSignal(signal, source, target) {
      if (this.effectRoleFilter === null) return true;
      const owner = source || target;
      if (!owner) return false;
      return this.effectRoleFilter.has(owner.roleKey || owner.role || "");
    }

    setEffectRoles(roleKeys = null) {
      this.effectRoleFilter = Array.isArray(roleKeys) ? new Set(roleKeys.filter(Boolean)) : null;
      this.state.vfxNodes.forEach((item) => item.node?.remove?.());
      this.state.vfxNodes = [];
      this.els?.fxLayer?.replaceChildren();
      return this.getEffectRoles();
    }

    getEffectRoles() {
      return this.effectRoleFilter === null ? null : [...this.effectRoleFilter];
    }

    playSkillFx(signal, source, target) {
      if (!source) return;
      const key = signal.skillKey || "";
      const tags = signal.tags || [];
      if (key === "cavalryDoubleLeap") {
        this.cavalryWindupFx(source, target);
        return;
      }
      if (key === "meteorRain") {
        this.meteorCastFx(source);
        return;
      }
      if (key === "sanctuary") {
        this.sanctuaryCastFx(source);
        return;
      }
      if (tags.includes("ultimate")) this.ring(source, "gold");
      if (!target) {
        this.ring(source, tags.includes("ultimate") ? "gold" : "blue");
        return;
      }
      if (/fire|burn|meteor|ember|flare|comet/i.test(key)) this.beam(source, target, "fire"), this.ring(target, "fire");
      else if (/poison|venom|plague|toxic|curse/i.test(key)) this.beam(source, target, "poison"), this.ring(target, "poison");
      else if (/heal|grace|mending|sanctuary/i.test(key)) this.ring(target, "green");
      else if (/shield|guard|banner|vow|wall/i.test(key)) this.ring(target, "blue");
      else if (/shadow|assassin|throat|midnight/i.test(key) || tags.includes("hidden")) this.slash(source, target, "purple");
      else if (/arrow|mark|lance|shot/i.test(key)) this.beam(source, target, "blue");
      else this.slash(source, target, /death|blood|wound|rage/i.test(key) ? "blood" : "gold");
    }

    displayUnitForRef(ref) {
      if (!ref) return null;
      const sideMap = { left: "ally", right: "enemy", ally: "ally", enemy: "enemy" };
      const side = sideMap[ref.side] || ref.side;
      const exact = this.state.units.find((unit) => unit.simId === ref.id || unit.id === ref.id || unit.unitId === ref.id);
      if (exact) return exact;
      const named = this.state.units.filter((unit) => side && unit.side === side && unit.name === ref.name);
      return named.length === 1 ? named[0] : null;
    }

    isResidualFireSignal(signal) {
      const tags = signal.tags || [];
      return tags.includes("fire") && (/火种余爆|燃烧/.test(signal.skillName || "") || tags.includes("dot"));
    }

    finishUnifiedIfNeeded() {
      const sim = this.state.unifiedSim;
      if (!sim) return;
      const leftAlive = sim.units.some((unit) => unit.side === "left" && sim.isAlive(unit));
      const rightAlive = sim.units.some((unit) => unit.side === "right" && sim.isAlive(unit));
      if (leftAlive && rightAlive && sim.time < this.maxTime) return;
      this.state.running = false;
      this.state.pendingStart = false;
      if (this.state.raf) clearInterval(this.state.raf);
      this.state.raf = 0;
      const authoritativeResult = sim.buildResult();
      const winner = authoritativeResult.winner;
      this.state.result = { ...authoritativeResult, passed: winner === "left" };
      this.state.logs.unshift(`${winner === "left" ? "\u80dc\u5229" : "\u5931\u8d25"} 路 ${sim.time.toFixed(1)}s`);
      this.onFinish(this.state.result);
    }
    stop(render = true) {
      if (this.state.raf) clearInterval(this.state.raf);
      this.state.raf = 0;
      this.state.running = false;
      this.state.pendingStart = false;
      this.state.unifiedSim = null;
      this.state.unifiedAccumulator = 0;
      this.state.vfxNodes.forEach((item) => item.node?.remove?.());
      this.state.vfxNodes = [];
      this.state.focusedUnitId = null;
      this.clearFocusNotices();
      if (render) this.render();
    }

    reset() {
      this.stop(false);
      this.state.time = 0;
      this.state.units = [];
      this.state.logs = [];
      this.state.result = null;
      this.state.signalBus?.clear();
      this.render();
    }

    destroy() {
      this.stop(false);
      this.state.postStack?.destroy?.();
      this.container.innerHTML = "";
    }

    skillApi() {
      return {
        iconBase: "",
        timerAliases: TIMER_ALIASES,
        isAlive: (unit) => this.alive(unit),
        hpRatio: (unit) => this.hpRatio(unit),
        statusCount: (unit) => this.statusCount(unit),
        effectivePower: (unit) => this.effectivePower(unit),
        enemiesOf: (unit) => this.enemies(unit),
        alliesOf: (unit) => this.allies(unit),
        lowestEnemy: (unit) => this.lowestEnemy(unit),
        backlineLowestEnemy: (unit) => this.backlineLowestEnemy(unit),
        lowestHpAlly: (unit) => this.lowestHpAlly(unit),
        carryAlly: (unit) => this.carryAlly(unit),
        byDistance: (unit) => this.byDistance(unit),
        hit: (source, target, amount, type, text, visible) => this.hit(source, target, amount, type, text, visible),
        blinkBacklineStrike: (unit, effect) => this.shadowStepStrike(unit, effect),
        shadowStepStrike: (unit, effect) => this.shadowStepStrike(unit, effect),
        shield: (unit, amount, text) => this.shield(unit, amount, text, 0),
        healUnit: (target, amount) => this.heal(target, target, amount),
        addPoison: (target, stacks, time, source) => this.poison(source, target, stacks, time),
        addBurn: (target, stacks, time, source) => this.burn(source, target, stacks, time),
        takeRaw: (target, amount) => this.takeRaw(target, amount),
        floater: (unit, text, tone) => this.floater(unit, text, tone),
        counterattack: (unit, source, effect, context) => this.counterattack(unit, source, effect, context),
        emitEffectSignal: (signal) => this.emitEffectSignal(signal),
      };
    }

    makeUnits(side, specs) {
      return specs.map((spec, index) => {
        const hero = this.normalizeSpec(spec, side, index);
        const slotIndex = Number.isFinite(spec.slotIndex) ? spec.slotIndex : index;
        const defaultSlot = formationSlot(side, slotIndex, specs.length);
        const slot = {
          x: Number.isFinite(spec.homeX) ? spec.homeX : Number.isFinite(spec.x) ? spec.x : defaultSlot.x,
          y: Number.isFinite(spec.homeY) ? spec.homeY : Number.isFinite(spec.y) ? spec.y : defaultSlot.y,
          line: spec.line || defaultSlot.line,
        };
        return {
          ...hero,
          unitId: `${side}_${index}`,
          side,
          slotIndex,
          x: slot.x,
          y: slot.y,
          line: slot.line,
          maxHp: hero.hp,
          hpNow: hero.hp,
          shield: 0,
          burn: { stacks: 0, time: 0, tick: 1 },
          poison: { stacks: 0, time: 0, tick: 1 },
          mark: 0,
          haste: 0,
          slow: 0,
          guard: 0,
          taunt: 0,
          immortal: 0,
          lifeSteal: 0,
          bloodFury: 0,
          whirlwind: 0,
          roarFury: 0,
          retaliationTimer: 0,
          retaliationEffect: null,
          counterCd: 0,
          bonusPowerTimer: 0,
          bonusPower: 0,
          hiddenTimer: 0,
          hiddenRetaliateTimer: 0,
          forcedTargetId: null,
          forcedTargetTimer: 0,
          assassinFocusTargetId: null,
          attackCd: 0.8,
          skillCd: [
            this.openingCooldown(hero.small[0], 1),
            this.openingCooldown(hero.small[1], 2.6),
          ],
          ultCd: this.openingCooldown(hero.ult, 14),
          focusTarget: "",
          focusHits: 0,
          deadTriggered: false,
        };
      });
    }

    normalizeSpec(spec, side, index) {
      const roleKey = spec.roleKey || spec.role || "warrior";
      const kit = SKILLS.roleKits?.[roleKey] || {};
      const stats = kit.stats || {};
      const name = spec.name || kit.name || `${side === "ally" ? "我方" : "敌方"}${index + 1}`;
      const roleName = spec.roleName || kit.role || kit.name || roleKey;
      return {
        id: spec.id || `${side}_${index}`,
        name,
        roleKey,
        roleName,
        unitKind: spec.unitKind || spec.kind || "",
        fantasy: spec.fantasy || "",
        icon: spec.iconText || ROLE_ICONS[roleKey] || (side === "ally" ? "⚔️" : "◆"),
        hp: Math.round(spec.maxHp || spec.hp || stats.hp || kit.hp || 300),
        power: Math.round(spec.power ?? stats.power ?? kit.power ?? 45),
        armor: Math.round(spec.armor ?? stats.armor ?? kit.armor ?? 8),
        magicResist: Math.round(spec.magicResist ?? stats.magicResist ?? kit.magicResist ?? 0),
        range: spec.range ?? stats.range ?? kit.range ?? 12,
        smallKeys: [
          spec.smallKeys?.[0] || spec.small1 || kit.kit?.small1,
          spec.smallKeys?.[1] || spec.small2 || kit.kit?.small2,
        ].filter(Boolean),
        small: [
          this.skillName(spec.small?.[0] || spec.small1 || kit.kit?.small1),
          this.skillName(spec.small?.[1] || spec.small2 || kit.kit?.small2 || "enemyNoop"),
        ],
        passiveKey: spec.passiveKey || spec.passive || kit.kit?.passive,
        passive: this.skillName(spec.passive || spec.passiveKey || kit.kit?.passive),
        ultKey: spec.ultKey || spec.ultimate || spec.ult || kit.kit?.ultimate,
        ult: this.skillName(spec.ult || spec.ultimate || spec.ultKey || kit.kit?.ultimate || "enemyNoUltimate"),
      };
    }

    skillName(value) {
      if (!value) return "无";
      return SKILLS.skills?.[value]?.name || value;
    }

    skillKey(name) {
      return SKILL_KEY_BY_NAME[name] || name;
    }

    openingCooldown(skillName, fallback) {
      if (skillName === "不死战吼") return BERSERKER_MODEL.openingCooldowns?.undyingRoar ?? 8;
      return SKILLS.skills?.[this.skillKey(skillName)]?.openingCooldown ?? fallback;
    }

    tick(now) {
      if (!this.state.running) return;
      const dt = this.frameDelta(now);
      this.update(dt);
      this.updatePresentation(dt);
      this.render();
    }

    update(dt) {
      this.state.time += dt;
      for (const unit of this.state.units.filter((item) => this.alive(item))) {
        this.tickStatus(unit, dt);
        unit.attackCd -= dt * (unit.haste > 0 ? 1.4 : 1);
        unit.skillCd = unit.skillCd.map((cd) => Math.max(0, cd - dt));
        unit.ultCd = Math.max(0, unit.ultCd - dt);
        for (const key of ["haste", "slow", "guard", "taunt", "immortal", "lifeSteal", "bloodFury", "whirlwind", "roarFury", "retaliationTimer", "bonusPowerTimer"]) {
          unit[key] = Math.max(0, unit[key] - dt);
        }
        for (const key of ["hiddenTimer", "hiddenRetaliateTimer", "forcedTargetTimer"]) {
          unit[key] = Math.max(0, unit[key] - dt);
        }
        if (unit.forcedTargetTimer <= 0) unit.forcedTargetId = null;
        unit.counterCd = Math.max(0, unit.counterCd - dt);

        const target = this.chooseTarget(unit);
        if (!target) continue;
        const distance = this.dist(unit, target);
        if (distance > unit.range) {
          this.moveToward(unit, target, dt);
          continue;
        }
        if (unit.ultCd <= 0) this.cast(unit, target, "ult");
        else if (unit.skillCd[0] <= 0) this.cast(unit, target, 0);
        else if (unit.skillCd[1] <= 0) this.cast(unit, target, 1);
        else if (unit.attackCd <= 0) this.basic(unit, target);
      }
      this.state.signalBus?.emitHealthSnapshots(this.state.units, this.state.time);
      this.finishIfNeeded();
    }

    tickStatus(unit, dt) {
      this.tickDot(unit, unit.burn, dt, 2.15, "burn");
      this.tickDot(unit, unit.poison, dt, 2.1, "poison");
    }

    tickDot(unit, dot, dt, perStack, type) {
      if (dot.stacks <= 0) return;
      dot.time -= dt;
      dot.tick -= dt;
      if (dot.tick <= 0) {
        dot.tick = 1;
        this.withAction(dot.source, { tags: ["dot", "damage", type], skillName: type === "poison" ? "剧毒" : "燃烧" }, () => {
          this.damage(dot.source || null, unit, dot.stacks * perStack, type);
        });
      }
      if (dot.time <= 0) dot.stacks = 0;
    }

    cast(unit, target, slot) {
      const skillName = slot === "ult" ? unit.ult : unit.small[slot];
      const skillKey = this.skillKey(skillName);
      const sharedSkill = this.sharedSkills[skillKey];
      this.label(unit, skillName, slot === "ult");
      if (slot === "ult") unit.ultCd = sharedSkill?.cooldown ?? 24;
      else unit.skillCd[slot] = sharedSkill?.cooldown ?? this.cooldownFor(skillName, slot);

      if (sharedSkill) {
        this.emitSignal({
          kind: "skill",
          tags: ["skill", slot === "ult" ? "ultimate" : "smallSkill", "cast"],
          source: this.unitRef(unit),
          target: this.unitRef(target),
          skillKey,
          skillName,
          meta: { slot, role: unit.roleName },
        });
        this.withAction(unit, { tags: ["skill", slot === "ult" ? "ultimate" : "smallSkill"], skillKey, skillName }, () => {
          sharedSkill.cast({ unit, target, visual: true });
        });
        if (slot === "ult") this.triggerEncore(unit);
        return;
      }

      if (["重击", "影切", "暗影收割"].includes(skillName)) this.slash(unit, target, "blood"), this.damage(unit, target, unit.power * (slot === "ult" ? 1.45 : 0.72), "physical");
      else if (["顺劈", "战旗冲锋"].includes(skillName)) this.enemies(unit).filter((enemy) => this.alive(enemy)).sort(this.byDistance(unit)).slice(0, 3).forEach((enemy) => this.slash(unit, enemy, "gold") || this.damage(unit, enemy, unit.power * 0.48, "physical"));
      if (slot === "ult") this.triggerEncore(unit);
    }

    basic(unit, target) {
      const isBerserker = unit.roleKey === "berserker" || unit.roleName === "狂战士" || unit.passive === "血怒引擎";
      const missingHp = isBerserker ? 1 - unit.hpNow / unit.maxHp : 0;
      const lowHpHaste = isBerserker ? 1 + missingHp * (BERSERKER_PASSIVE.lowHpHaste ?? 0) : 1;
      unit.attackCd = (isBerserker ? (BERSERKER_MODEL.basicAttackCooldown ?? 1.35) : 1.35) / lowHpHaste;
      const power = this.effectivePower(unit);
      let amount = isBerserker ? (BERSERKER_MODEL.basicFlatDamage ?? 10) + power * (BERSERKER_MODEL.basicPowerRatio ?? 0.22) : 10 + power * 0.22;
      let visible = false;
      let basicLabel = "攻击";
      if (unit.bloodFury > 0) {
        amount += power * (BERSERKER_RATIOS.blood ?? 0.45) * (1 + (1 - unit.hpNow / unit.maxHp) * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45));
        visible = true;
        basicLabel = "血怒普攻";
      }
      if (unit.whirlwind > 0) {
        amount += power * (BERSERKER_RATIOS.whirlwind ?? 0.3);
        visible = true;
        basicLabel = basicLabel === "攻击" ? "旋风普攻" : basicLabel;
      }
      if (unit.roarFury > 0) {
        amount += power * (BERSERKER_RATIOS.roar ?? 0.35);
        visible = true;
        basicLabel = "战吼普攻";
      }
      this.withAction(unit, { tags: ["basic", "attack"], skillName: basicLabel, meta: { windows: this.activeWindows(unit) } }, () => {
        this.damage(unit, target, amount, "physical", visible);
      });
      if (unit.passive === "血怒引擎" && unit.hpNow < unit.maxHp) {
        const leech = amount * ((BERSERKER_PASSIVE.baseLeech ?? 0.06) + (1 - unit.hpNow / unit.maxHp) * (BERSERKER_PASSIVE.missingHpLeech ?? 0.08));
        unit.hpNow = Math.min(unit.maxHp, unit.hpNow + leech);
        if (visible) this.floater(unit, `吸血+${Math.round(leech)}`, "heal");
      }
      if (unit.whirlwind > 0) {
        this.enemies(unit).filter((enemy) => this.alive(enemy) && enemy.unitId !== target.unitId).sort(this.byDistance(target)).slice(0, BERSERKER_MODEL.splashTargets ?? 2)
          .forEach((enemy) => this.withAction(unit, { tags: ["basic", "attack", "area", "splash"], skillName: "旋风溅射", meta: { windows: this.activeWindows(unit) } }, () => {
            this.damage(unit, enemy, power * (BERSERKER_RATIOS.splash ?? 0.18), "physical", true);
          }));
      }
    }

    hit(source, target, amount, type, text, visible = true) {
      this.damage(source, target, amount, type, visible);
      if (visible && text) this.label(source, text);
    }

    damage(source, target, amount, type, visible = true) {
      if (!this.alive(target)) return;
      const hpBefore = target.hpNow;
      const directDefense = type === "physical" ? target.armor : target.magicResist;
      let value = Math.max(1, amount - directDefense * 0.7);
      if (source?.passive === "破阵步" && target.line === "前排") value *= 1.12;
      if (source?.passive === "血怒引擎") value *= 1 + (1 - source.hpNow / source.maxHp) * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45);
      if (source?.passive === "破绽毒刃" && (target.poison.stacks > 0 || target.burn.stacks > 0)) value *= 1.18;
      if (source?.passive === "催化剂" && this.statusCount(target) > 0) value *= 1.12;
      value *= SKILLS.passiveDamageMultiplier?.(source, target, { statusCount: (unit) => this.statusCount(unit), hpRatio: (unit) => this.hpRatio(unit) }) || 1;
      if (target.guard > 0) value *= 0.72;
      let blocked = 0;
      if (target.shield > 0) {
        blocked = Math.min(target.shield, value);
        target.shield -= blocked;
        value -= blocked;
      }
      if (blocked > 0) this.floater(target, `护盾-${Math.round(blocked)}`, "shield");
      if (value > 0) {
        if (target.immortal > 0 && target.hpNow - value <= 1) value = Math.max(0, target.hpNow - 1);
        target.hpNow = Math.max(0, target.hpNow - value);
        if (value > 0) {
          this.emitSignal({
            kind: "damage",
            tags: this.actionTags(source, ["damage", type, blocked > 0 ? "blocked" : "", value !== amount ? "mitigated" : ""]).filter(Boolean),
            source: this.unitRef(source),
            target: this.unitRef(target),
            amount: value,
            skillKey: source?._actionSignal?.skillKey || null,
            skillName: source?._actionSignal?.skillName || "",
            hpBefore,
            hpAfter: target.hpNow,
            meta: { rawAmount: amount, blocked, shieldAfter: target.shield || 0, ...source?._actionSignal?.meta },
          });
        }
        if (source?.lifeSteal > 0 && value > 0) {
          const leech = value * (BERSERKER_PASSIVE.roarLeech ?? 0.18);
          const before = source.hpNow;
          source.hpNow = Math.min(source.maxHp, source.hpNow + leech);
          this.emitSignal({ kind: "heal", tags: this.actionTags(source, ["heal", "lifeSteal"]).filter(Boolean), source: this.unitRef(source), target: this.unitRef(source), amount: source.hpNow - before, skillName: "吸血", hpBefore: before, hpAfter: source.hpNow });
          if (visible) this.floater(source, `吸血+${Math.round(leech)}`, "heal");
        }
        const cls = type === "burn" || type === "fire" ? "fire" : type === "poison" ? "poison" : "";
        const prefix = type === "burn" ? "燃烧-" : type === "poison" ? "剧毒-" : "-";
        if (visible) this.floater(target, `${prefix}${Math.round(value)}`, cls);
        if (target.hpNow <= 0) this.onDeath(target, source);
      }
      SKILLS.triggerReactiveEffects?.("afterDamageTaken", { unit: target, source, blocked, damageTaken: value, rawAmount: amount, type, visual: visible }, { counterattack: (unit, attacker, effect, context) => this.counterattack(unit, attacker, effect, context) });
    }

    shield(unit, amount, text, guardSeconds = 3) {
      if (!unit) return;
      unit.shield += amount;
      unit.guard = Math.max(unit.guard, guardSeconds);
      this.emitSignal({ kind: "shield", tags: this.actionTags(null, ["shield"]).filter(Boolean), source: null, target: this.unitRef(unit), amount, skillName: text, shield: unit.shield });
      this.floater(unit, `${text || "护盾"}+${Math.round(amount)}`, "shield");
      this.ring(unit, "blue");
    }

    heal(source, target, amount) {
      if (!target) return;
      const before = target.hpNow;
      target.hpNow = Math.min(target.maxHp, target.hpNow + amount);
      this.emitSignal({ kind: "heal", tags: this.actionTags(source, ["heal"]).filter(Boolean), source: this.unitRef(source), target: this.unitRef(target), amount: target.hpNow - before, skillName: source?._actionSignal?.skillName || "治疗", hpBefore: before, hpAfter: target.hpNow });
      this.floater(target, `治疗+${Math.round(amount)}`, "heal");
      this.ring(target, "green");
    }

    burn(source, target, stacks, time = 6) {
      target.burn.stacks += stacks;
      target.burn.time = Math.max(target.burn.time, time);
      target.burn.source = source;
      this.emitSignal({ kind: "status", tags: this.actionTags(source, ["status", "debuff", "burn", "dotStack"]).filter(Boolean), source: this.unitRef(source), target: this.unitRef(target), amount: stacks, skillName: source?._actionSignal?.skillName || "燃烧", meta: { stacks: target.burn.stacks, duration: target.burn.time } });
      this.floater(target, `燃烧+${stacks}`, "fire");
      this.ring(target, "fire");
    }

    poison(source, target, stacks, time = 8) {
      target.poison.stacks = Math.min(20, target.poison.stacks + stacks);
      target.poison.time = Math.max(target.poison.time, time);
      target.poison.source = source;
      this.emitSignal({ kind: "status", tags: this.actionTags(source, ["status", "debuff", "poison", "dotStack"]).filter(Boolean), source: this.unitRef(source), target: this.unitRef(target), amount: stacks, skillName: source?._actionSignal?.skillName || "剧毒", meta: { stacks: target.poison.stacks, duration: target.poison.time } });
      this.floater(target, `剧毒+${stacks}`, "poison");
      this.ring(target, "poison");
    }

    takeRaw(target, amount) {
      if (!target) return;
      target.hpNow = Math.max(1, target.hpNow - amount);
    }

    counterattack(unit, source, effect, context = {}) {
      if (!this.alive(unit) || !this.alive(source) || (unit.counterCd || 0) > 0) return;
      unit.counterCd = effect.cooldown || 0;
      const amount = (effect.flat || 0) + this.effectivePower(unit) * (effect.power || 0) + (context.blocked || 0) * (effect.blockedRatio || 0);
      this.withAction(unit, { tags: ["counter", "reactive"], skillKey: unit.passiveKey || this.skillKey(unit.passive), skillName: effect.label || "反击", meta: { blockedTrigger: context.blocked || 0 } }, () => this.damage(unit, source, amount, "physical", context.visual));
      if (context.visual) this.floater(unit, effect.label || "反击", "shield");
    }

    emitEffectSignal(signal) {
      this.emitSignal({ ...signal, source: this.unitRef(signal.source), target: this.unitRef(signal.target), skillKey: signal.source?._actionSignal?.skillKey || null, skillName: signal.source?._actionSignal?.skillName || "" });
    }

    onDeath(unit, killer) {
      if (unit.deadTriggered) return;
      unit.deadTriggered = true;
      this.emitSignal({ kind: "death", tags: ["death"], source: this.unitRef(killer), target: this.unitRef(unit), skillKey: killer?._actionSignal?.skillKey || null, skillName: killer?._actionSignal?.skillName || "", hpBefore: 0, hpAfter: 0 });
      this.floater(unit, "倒下", "");
    }

    triggerEncore(caster) {
      this.allies(caster).filter((ally) => this.alive(ally) && ally.passive === "返场").forEach((bard) => {
        bard.skillCd = bard.skillCd.map((cd) => Math.max(0, cd - 2));
        this.floater(bard, "返场", "heal");
      });
    }

    cooldownFor(skillName, slot) {
      if (skillName === "血怒斩") return BERSERKER_COOLDOWNS.bloodStrike ?? 5.2;
      if (skillName === "裂骨旋风") return BERSERKER_COOLDOWNS.boneWhirl ?? 8.4;
      return slot === 0 ? 5.2 : 8.4;
    }

    moveToward(unit, target, dt) {
      const d = this.dist(unit, target);
      if (!d) return;
      const step = dt * (unit.slow > 0 ? 4.8 : 8);
      unit.x += ((target.x - unit.x) / d) * step;
      unit.y += ((target.y - unit.y) / d) * step;
    }

    finishIfNeeded() {
      const allyAlive = this.state.units.some((unit) => unit.side === "ally" && this.alive(unit));
      const enemyAlive = this.state.units.some((unit) => unit.side === "enemy" && this.alive(unit));
      if (allyAlive && enemyAlive && this.state.time < this.maxTime) return;
      this.state.running = false;
      if (this.state.raf) clearInterval(this.state.raf);
      this.state.raf = 0;
      const leftHp = this.sideHpScore("ally");
      const rightHp = this.sideHpScore("enemy");
      const passed = leftHp >= rightHp;
      this.state.result = {
        passed,
        winner: passed ? "left" : "right",
        duration: this.state.time,
        leftHp,
        rightHp,
        units: this.state.units,
        signals: this.state.signalBus?.signals || [],
        metrics: this.metrics(),
      };
      this.state.logs.unshift(`${passed ? "胜利" : "失败"} · ${this.state.time.toFixed(1)}s`);
      this.onFinish(this.state.result);
    }

    metrics() {
      return {
        leftAlive: this.state.units.filter((unit) => unit.side === "ally" && this.alive(unit)).length,
        rightAlive: this.state.units.filter((unit) => unit.side === "enemy" && this.alive(unit)).length,
        leftDamage: Math.round(this.state.signalBus?.query(["damage"]).filter((signal) => signal.source?.side === "ally").reduce((sum, signal) => sum + signal.amount, 0) || 0),
        rightDamage: Math.round(this.state.signalBus?.query(["damage"]).filter((signal) => signal.source?.side === "enemy").reduce((sum, signal) => sum + signal.amount, 0) || 0),
        leftHealing: Math.round(this.state.signalBus?.query(["heal"]).filter((signal) => signal.target?.side === "ally").reduce((sum, signal) => sum + signal.amount, 0) || 0),
        leftShield: Math.round(this.state.signalBus?.query(["shield"]).filter((signal) => signal.target?.side === "ally").reduce((sum, signal) => sum + signal.amount, 0) || 0),
      };
    }

    render() {
      if (!this.els) return;
      this.els.state.textContent = this.state.pendingStart ? "战斗准备" : this.state.running ? "交战中" : this.state.result ? (this.state.result.passed ? "胜利" : "失败") : "待命";
      this.els.time.textContent = `${this.state.time.toFixed(1)}s`;
      if (this.els.startButton) this.els.startButton.hidden = !this.state.pendingStart;
      this.els.left.textContent = String(this.state.units.filter((unit) => unit.side === "ally" && this.alive(unit)).length);
      this.els.right.textContent = String(this.state.units.filter((unit) => unit.side === "enemy" && this.alive(unit)).length);
      const focused = this.focusedUnit();
      if (this.els.focusHint) {
        this.els.focusHint.textContent = focused ? `正在关注：${focused.name} · 再点取消，点其他单位切换` : "点击任意单位关注技能";
        this.els.focusHint.classList.toggle("has-focus", Boolean(focused));
      }
      if (this.els.focusFeed) {
        this.els.focusFeed.classList.toggle("side-left", focused?.side === "ally");
        this.els.focusFeed.classList.toggle("side-right", focused?.side === "enemy");
      }
      this.renderDistanceRuler();
      this.els.unitLayer.innerHTML = this.state.units.map((unit) => {
        const seed = Object.values(unit.natureSeeds || {}).sort((a, b) => (b.growth || 0) - (a.growth || 0))[0];
        const seedHtml = seed ? `<span class="battle-nature-seed growth-${Math.max(1, Math.min(3, seed.growth || 1))}"><img src="${NATURE_SEED_ICON}" alt=""><b>${"●".repeat(Math.max(1, Math.min(3, seed.growth || 1)))}</b><small>${Math.max(0, seed.time || 0).toFixed(1)}s</small></span>` : "";
        return `
        <div class="battle-unit ${unit.side === "enemy" ? "enemy" : ""} ${unit.unitKind === "militia" ? "militia-unit" : ""} ${unit.hiddenTimer > 0 ? "hidden" : ""} ${unit.guardTimer > 0 ? "guarded" : ""} ${focused?.unitId === unit.unitId ? "focused" : ""} ${this.alive(unit) ? "" : "dead"}" style="${this.pointStyle(unit)}" data-battle-unit-id="${unit.unitId}" role="button" tabindex="0" aria-pressed="${focused?.unitId === unit.unitId ? "true" : "false"}" aria-label="关注${unit.name}">
          ${seedHtml}
          <div class="battle-avatar">${unit.icon}</div>
          <div class="battle-unit-name">${unit.name}</div>
          <div class="battle-hp"><span style="width:${Math.max(0, unit.hpNow / unit.maxHp * 100)}%"></span></div>
        </div>
      `; }).join("");
      this.els.log.innerHTML = this.state.logs.slice(0, 10).map((item) => `<div>${item}</div>`).join("");
    }

    label(unit, text, ult = false) {
      if (!unit || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = `battle-skill-label ${ult ? "ult" : ""}`;
      node.textContent = text;
      this.placeNode(node, unit, -10);
      this.els.fxLayer.appendChild(node);
      this.removeNodeLater(node, ult ? 1050 : 780);
      if (text && text !== "攻击") this.state.logs.unshift(`${unit.name}：${text}`);
    }

    floater(unit, text, cls = "") {
      if (!unit || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = `battle-floater ${cls}`;
      node.textContent = text;
      this.placeNode(node, unit);
      this.els.fxLayer.appendChild(node);
      this.removeNodeLater(node, 900);
    }

    ring(unit, color = "gold") {
      if (!unit || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = `battle-vfx-ring battle-vfx-${color}`;
      this.placeNode(node, unit);
      node.style.setProperty("--scale", this.effectCameraScale().toFixed(3));
      this.els.fxLayer.appendChild(node);
      this.removeNodeLater(node, 720);
    }

    screenBeat(tone = "gold") {
      if (!this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = `battle-vfx-screen-beat tone-${tone}`;
      this.els.fxLayer.appendChild(node);
      this.removeNodeLater(node, 620);
    }

    motionStreak(from, to, tone = "gold") {
      if (!from || !to || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = `battle-vfx-motion-streak tone-${tone}`;
      const length = this.nodeDistance(from, to);
      this.placeNode(node, from);
      node.style.width = this.state.camera ? `${length}px` : `${length}%`;
      node.style.transform = `translateY(-50%) rotate(${this.nodeAngle(from, to)}rad)`;
      this.els.fxLayer.appendChild(node);
      this.removeNodeLater(node, 520);
    }

    cavalryWindupFx(source, target) {
      if (!source || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = "battle-vfx-cavalry-windup";
      node.innerHTML = "<i></i><i></i><i></i>";
      if (target) node.style.setProperty("--angle", `${this.nodeAngle(source, target)}rad`);
      this.placeNode(node, source);
      this.els.fxLayer.appendChild(node);
      this.screenBeat("earth");
      this.removeNodeLater(node, 760);
    }

    cavalryLeapFx(before, source, landing = 1) {
      if (!source || !this.els?.fxLayer) return;
      if (before) {
        this.afterimage(before, source, "gold");
        this.motionStreak(before, source, "earth");
      }
      const node = document.createElement("div");
      node.className = `battle-vfx-hoof-impact landing-${Math.max(1, Math.min(2, landing))}`;
      node.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i>";
      this.placeNode(node, source);
      this.els.fxLayer.appendChild(node);
      if (landing >= 2) this.screenBeat("earth");
      this.removeNodeLater(node, 820);
    }

    meteorCastFx(source) {
      if (!source || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = "battle-vfx-meteor-cast";
      node.innerHTML = "<i></i><i></i><i></i>";
      this.placeNode(node, source);
      this.els.fxLayer.appendChild(node);
      this.screenBeat("fire");
      this.removeNodeLater(node, 1180);
    }

    meteorImpactFx(target) {
      if (!target || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = "battle-vfx-meteor-impact";
      node.innerHTML = "<i class=\"meteor-tail\"></i><i class=\"meteor-core\"></i><i class=\"meteor-crater\"></i><b></b><b></b><b></b><b></b>";
      this.placeNode(node, target);
      this.els.fxLayer.appendChild(node);
      this.removeNodeLater(node, 980);
    }

    sanctuaryCastFx(source) {
      if (!source || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = "battle-vfx-sanctuary";
      node.innerHTML = "<i></i><i></i><i></i><b>✦</b>";
      this.placeNode(node, source);
      this.els.fxLayer.appendChild(node);
      this.screenBeat("holy");
      this.removeNodeLater(node, 1380);
    }

    priestBlessingFx(source, target) {
      if (!target || !this.els?.fxLayer) return;
      if (source && source.unitId !== target.unitId) {
        const tether = document.createElement("div");
        tether.className = "battle-vfx-holy-tether";
        const length = this.nodeDistance(source, target);
        this.placeNode(tether, source);
        tether.style.width = this.state.camera ? `${length}px` : `${length}%`;
        tether.style.transform = `translateY(-50%) rotate(${this.nodeAngle(source, target)}rad)`;
        this.els.fxLayer.appendChild(tether);
        this.removeNodeLater(tether, 760);
      }
      const node = document.createElement("div");
      node.className = "battle-vfx-blessing";
      node.innerHTML = "<i></i><i></i><b>✦</b>";
      this.placeNode(node, target);
      this.els.fxLayer.appendChild(node);
      this.removeNodeLater(node, 1120);
    }

    natureSeedFx(unit, action = "plant") {
      if (!unit || !this.els?.fxLayer) return;
      const node = document.createElement("img");
      node.className = `battle-vfx-seed ${action === "bloom" ? "bloom" : ""}`;
      node.alt = "";
      node.src = NATURE_SEED_ICON;
      this.placeNode(node, unit);
      this.els.fxLayer.appendChild(node);
      this.removeNodeLater(node, action === "bloom" ? 980 : 680);
      if (action === "bloom") {
        const burst = document.createElement("div");
        burst.className = "battle-vfx-bloom-burst";
        this.placeNode(burst, unit);
        this.els.fxLayer.appendChild(burst);
        this.removeNodeLater(burst, 980);
      }
      this.ring(unit, "green");
    }

    afterimage(before, unit, color = "purple") {
      if (!unit || !before || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = `battle-vfx-afterimage battle-vfx-${color}`;
      this.placeNode(node, before);
      node.textContent = unit.icon || "";
      this.els.fxLayer.appendChild(node);
      this.removeNodeLater(node, 520);
    }

    slash(source, target, color = "gold") {
      if (!source || !target || !this.els?.fxLayer) return;
      const node = document.createElement("img");
      node.className = `battle-vfx-slash battle-vfx-${color}`;
      node.alt = "";
      node.onerror = () => node.remove();
      node.src = `${SLASH_BASE}/slash_02_a.png`;
      this.placeNode(node, { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 });
      node.style.setProperty("--angle", `${this.nodeAngle(source, target)}rad`);
      node.style.setProperty("--scale", this.effectCameraScale().toFixed(3));
      this.els.fxLayer.appendChild(node);
      this.removeNodeLater(node, 480);
    }

    beam(source, target, color = "blue") {
      if (!source || !target || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = `battle-vfx-beam battle-vfx-${color}`;
      const length = this.nodeDistance(source, target);
      this.placeNode(node, source);
      node.style.width = this.state.camera ? `${length}px` : `${length}%`;
      node.style.transform = `rotate(${this.nodeAngle(source, target)}rad)`;
      this.els.fxLayer.appendChild(node);
      this.removeNodeLater(node, 360);
    }

    chooseTarget(unit) {
      const foes = this.enemies(unit).filter((enemy) => this.alive(enemy));
      if (!foes.length) return null;
      if (unit.forcedTargetId && unit.forcedTargetTimer > 0) {
        const forced = foes.find((foe) => foe.unitId === unit.forcedTargetId || foe.id === unit.forcedTargetId);
        if (forced) return forced;
      }
      if (unit.roleKey === "assassin" && unit.assassinFocusTargetId) {
        const focus = foes.find((foe) => foe.unitId === unit.assassinFocusTargetId || foe.id === unit.assassinFocusTargetId);
        if (focus) return focus;
        unit.assassinFocusTargetId = null;
      }
      const taunters = unit.range < 20 ? foes.filter((foe) => foe.taunt > 0) : [];
      if (taunters.length) return taunters.sort(this.byDistance(unit))[0];
      if (unit.roleKey === "assassin") return foes.sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0];
      const front = foes.filter((foe) => foe.line === "前排");
      return (front.length && unit.range < 30 ? front : foes).sort(this.byDistance(unit))[0];
    }

    allies(unit) { return this.state.units.filter((item) => item.side === unit.side); }
    enemies(unit) { return this.state.units.filter((item) => item.side !== unit.side); }
    alive(unit) { return unit && unit.hpNow > 0; }
    hpRatio(unit) { return unit.hpNow / unit.maxHp; }
    dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    byDistance(unit) { return (a, b) => this.dist(unit, a) - this.dist(unit, b); }
    statusCount(unit) { return unit.poison.stacks + unit.burn.stacks + (unit.slow > 0 ? 2 : 0) + (unit.mark || 0); }
    effectivePower(unit) { return unit.power + (unit.bonusPowerTimer > 0 ? unit.bonusPower || 14 : 0); }
    lowestEnemy(unit) { return this.enemies(unit).filter((enemy) => this.alive(enemy)).sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0]; }
    backlineLowestEnemy(unit) {
      const foes = this.enemies(unit).filter((enemy) => this.alive(enemy));
      const backline = foes.filter((enemy) => enemy.line === "后排");
      return (backline.length ? backline : foes).sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0];
    }
    lowestHpAlly(unit) { return this.allies(unit).filter((ally) => this.alive(ally)).sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0]; }
    carryAlly(unit) { return this.allies(unit).filter((ally) => this.alive(ally)).sort((a, b) => this.effectivePower(b) - this.effectivePower(a))[0]; }
    sideHpScore(side) { return this.state.units.filter((unit) => unit.side === side).reduce((sum, unit) => sum + Math.max(0, unit.hpNow / unit.maxHp), 0); }
    unitRef(unit) { return SIGNALS.unitRef ? SIGNALS.unitRef(unit) : unit ? { id: unit.unitId || unit.id, name: unit.name, side: unit.side, role: unit.roleName } : null; }
    emitSignal(signal) { this.state.signalBus?.emit({ time: this.state.time, ...signal }); }
    withAction(unit, action, fn) {
      if (!unit) return fn();
      const previous = unit._actionSignal;
      unit._actionSignal = action;
      try {
        return fn();
      } finally {
        unit._actionSignal = previous;
      }
    }
    actionTags(source, tags) { return [...(source?._actionSignal?.tags || []), ...tags]; }
    shadowStepStrike(unit, effect = {}) {
      if (!this.alive(unit)) return;
      const foes = this.enemies(unit).filter((enemy) => this.alive(enemy));
      let target = unit.assassinFocusTargetId
        ? foes.find((enemy) => enemy.unitId === unit.assassinFocusTargetId || enemy.id === unit.assassinFocusTargetId)
        : null;
      if (!target) target = this.backlineLowestEnemy(unit);
      if (!target) return;

      const before = { x: unit.x, y: unit.y };
      const sideOffset = unit.side === "ally" ? -3.8 : 3.8;
      unit.x = Math.max(7, Math.min(93, target.x + sideOffset));
      unit.y = Math.max(12, Math.min(88, target.y + (effect.yOffset || 1.6)));
      unit.attackCd = Math.min(unit.attackCd, effect.attackCd ?? 0.08);
      unit.forcedTargetId = target.unitId || target.id;
      unit.forcedTargetTimer = effect.lockDuration ?? 3.2;
      unit.assassinFocusTargetId = unit.forcedTargetId;
      unit.hiddenRetaliateTimer = effect.retaliateDuration ?? 2.2;
      if (effect.hiddenDuration) unit.hiddenTimer = Math.max(unit.hiddenTimer || 0, effect.hiddenDuration);
      if (effect.guardDuration) unit.guard = Math.max(unit.guard || 0, effect.guardDuration);

      this.emitSignal({
        kind: "movement",
        tags: this.actionTags(unit, ["movement", "blink", "backline", "shadowStep", effect.hiddenDuration ? "hidden" : ""]).filter(Boolean),
        source: this.unitRef(unit),
        target: this.unitRef(target),
        amount: Math.round(this.dist(before, unit) * 1000) / 1000,
        skillKey: unit?._actionSignal?.skillKey || null,
        skillName: effect.label || unit?._actionSignal?.skillName || "暗影突袭",
        meta: { before, after: { x: unit.x, y: unit.y }, lockDuration: unit.forcedTargetTimer, hiddenDuration: effect.hiddenDuration || 0 },
      });

      const amount = (effect.flat || 0) + this.effectivePower(unit) * (effect.power || 0) + (1 - this.hpRatio(target)) * (effect.missingTargetHpFlat || 0);
      this.damage(unit, target, amount, effect.type || "physical", true);
      if (effect.markStacks) {
        target.mark = Math.min(effect.markMax || 5, (target.mark || 0) + effect.markStacks);
        this.emitSignal({
          kind: "status",
          tags: this.actionTags(unit, ["status", "debuff", "mark", "backline", "shadowStep"]).filter(Boolean),
          source: this.unitRef(unit),
          target: this.unitRef(target),
          amount: effect.markStacks,
          skillKey: unit?._actionSignal?.skillKey || null,
          skillName: effect.label || unit?._actionSignal?.skillName || "暗影突袭",
          meta: { stacks: target.mark },
        });
      }
    }
    activeWindows(unit) {
      return [
        unit.bloodFury > 0 ? "bloodFury" : "",
        unit.whirlwind > 0 ? "whirlwind" : "",
        unit.roarFury > 0 ? "roarFury" : "",
        unit.haste > 0 ? "haste" : "",
      ].filter(Boolean);
    }
  }

  window.GAME_BATTLE_VIEW = {
    mount(options) {
      return new BattleView(options);
    },
  };
})();
