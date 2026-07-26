"use strict";

const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

async function run() {
  const root = __dirname;
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--allow-file-access-from-files", "--disable-gpu"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(pathToFileURL(path.join(root, "index.html")).href, { waitUntil: "load" });
  await page.evaluate(() => localStorage.removeItem("infinite_loot_fifteen_day_web_v1"));
  await page.reload({ waitUntil: "load" });
  await page.locator("#day-rail .day-step").first().waitFor();
  assert.equal(await page.locator("#day-rail .day-step").count(), 15, "浏览器没有渲染十五日时间轴");
  assert.equal(await page.locator("#ap-outside-value").textContent(), "3", "首日行动点错误");
  assert.equal(await page.locator(".map-node").count(), 6, "首屏地图没有直接呈现六个当前地点");
  assert.equal(await page.locator("#event-popover").isHidden(), true, "尚未点击地点时不应预先打开事件浮窗");
  assert.equal(await page.locator(".world-panel, .stage-panel, .action-panel").count(), 0, "旧三栏操作结构仍然存在");

  const outerNode = page.locator(".map-node", { hasText: "灰炉外环" });
  await outerNode.click();
  await page.locator("#event-popover").waitFor({ state: "visible" });
  assert((await page.locator("#scene-description").textContent()).includes("煤灰覆盖"), "点击地图点位后没有就地显示地点描述");
  assert.equal(await page.getByRole("button", { name: /LV1 · 煤灰废道/ }).count(), 1, "点位浮窗没有给出灰炉LV1入口");
  assert.equal(await page.locator(".action-button.grind-action").count(), 3, "灰炉没有同时提供LV1/LV2/LV3三组敌阵");
  await page.waitForTimeout(700);
  const [nodeBox, popoverBox] = await Promise.all([outerNode.boundingBox(), page.locator("#event-popover").boundingBox()]);
  assert(nodeBox && popoverBox && Math.abs((nodeBox.x + nodeBox.width / 2) - (popoverBox.x + popoverBox.width / 2)) < 720, "事件浮窗没有锚定在所选地点附近");
  await page.screenshot({ path: path.join(os.tmpdir(), "agentautomata-fifteen-day-web-preview.png"), fullPage: true });

  const transformBeforeZoom = await page.locator("#map-world").evaluate((node) => node.style.transform);
  await page.locator("#map-viewport").hover({ position: { x: 700, y: 300 } });
  await page.mouse.wheel(0, -360);
  const transformAfterZoom = await page.locator("#map-world").evaluate((node) => node.style.transform);
  assert.notEqual(transformAfterZoom, transformBeforeZoom, "滚轮没有通过共享 camera 改变地图镜头");
  await page.mouse.move(90, 620);
  await page.mouse.down();
  await page.mouse.move(175, 660, { steps: 5 });
  await page.mouse.up();
  const transformAfterDrag = await page.locator("#map-world").evaluate((node) => node.style.transform);
  assert.notEqual(transformAfterDrag, transformAfterZoom, "拖动空白地图没有移动 camera");
  await page.locator("#map-reset-camera").click();
  await page.locator("#map-viewport").click({ position: { x: 48, y: 520 } });
  assert.equal(await page.locator("#event-popover").isHidden(), true, "点击地图空白处没有收起事件浮窗");
  await outerNode.click();

  const apBeforeGrind = await page.locator("#ap-outside-value").textContent();
  await page.getByRole("button", { name: /LV1 · 煤灰废道/ }).click();
  await page.locator("#grind-view").waitFor({ state: "visible" });
  assert.equal(await page.locator("#map-view").isHidden(), true, "开始刷装后地图没有让位给整页战斗");
  await page.locator("#grind-battle-mount .battle-view-field").waitFor({ state: "visible", timeout: 10000 });
  await page.locator(".grind-loot-cell").nth(1).waitFor({ state: "visible", timeout: 60000 });
  assert(Number.parseInt(await page.locator("#grind-loot-count").textContent(), 10) >= 2, "连续刷装没有自动进入第二轮并累计掉落");
  await page.screenshot({ path: path.join(os.tmpdir(), "agentautomata-fifteen-day-grind-loop.png"), fullPage: true });
  assert.equal(await page.locator("#ap-outside-value").textContent(), apBeforeGrind, "免费刷装错误消耗了行动点");
  await page.locator("#stop-grind").click();
  if (await page.locator("#grind-view").isVisible()) {
    await page.locator("[data-grind-leave]").waitFor({ state: "visible", timeout: 45000 });
    await page.locator("[data-grind-leave]").click();
  }
  await page.locator("#map-view").waitFor({ state: "visible" });
  const grindInventory = Number.parseInt(await page.locator("#inventory-count").textContent(), 10);
  assert(grindInventory >= 3, "连续战斗掉落没有进入背包");
  await page.getByRole("button", { name: /背包/ }).click();
  assert.equal(await page.locator(".inventory-cell").count(), grindInventory, "背包网格没有渲染战斗掉落");

  await page.locator("#end-day-button").click();
  assert.equal(await page.locator(".day-step.current i").textContent(), "2", "结束第一日后没有准确推进一天");
  await page.locator("#end-day-button").click();
  assert.equal(await page.locator(".day-step.current i").textContent(), "3", "结束第二日后没有准确推进一天");

  if (await page.locator("#event-popover").isVisible()) await page.locator("#event-popover-close").click();
  await page.locator("#map-reset-camera").click();
  await page.waitForTimeout(250);
  const quartermasterNode = page.locator(".map-node", { hasText: "河畔营地的军需车" });
  await quartermasterNode.click();
  await page.getByRole("button", { name: /正面袭击军需守卫/ }).click();
  await page.locator("#combat-view").waitFor({ state: "visible" });
  assert.equal(await page.locator("#map-view").isHidden(), true, "进入战斗后地图层仍覆盖战斗层");
  assert((await page.locator("#campaign-grid").getAttribute("class")).includes("combat-mode"), "战斗没有切换为全宽布局");
  await page.locator(".battle-view-field").waitFor({ state: "visible", timeout: 10000 });
  await page.screenshot({ path: path.join(os.tmpdir(), "agentautomata-fifteen-day-river-combat.png"), fullPage: true });

  await page.locator("#leave-combat").waitFor({ state: "visible", timeout: 45000 });
  const resultText = await page.locator("#combat-result").innerText();
  assert(resultText.includes("存活") && resultText.includes("伤害") && resultText.includes("治疗"), "战后没有提供可读结果");
  await page.locator("#leave-combat").click();
  await page.locator("#map-view").waitFor({ state: "visible" });
  assert.equal(await page.locator(".campaign-grid.combat-mode").count(), 0, "确认战果后没有返回地图");

  await page.evaluate(() => {
    const massState = window.FIFTEEN_DAY_DEMO.createInitialState("browser-mass-visual");
    massState.day = 15;
    massState.phase = "showdown";
    massState.showdownAct = 3;
    massState.roster = ["player", "shield", "apothecary", "thief", "duelist", "exile", "champion", "priest", "engineer", "mage"];
    massState.activeParty = massState.roster.slice();
    massState.formation = Object.fromEntries(massState.activeParty.map((id, index) => [id, index]));
    massState.resources.influence = 20;
    massState.flags.bannerCompany = true;
    massState.flags.warCouncil = "miners";
    localStorage.setItem("infinite_loot_fifteen_day_web_v1", JSON.stringify(massState));
  });
  await page.reload({ waitUntil: "load" });
  await page.locator(".map-node", { hasText: "围剿联盟" }).click();
  await page.getByRole("button", { name: /依托现有防线迎战（20对10）/ }).click();
  await page.locator(".battle-unit").first().waitFor({ state: "visible", timeout: 10000 });
  assert.equal(await page.locator(".battle-unit").count(), 30, "20 对 10 大战没有渲染完整三十个单位");
  let overlappingUnits = Infinity;
  for (let sample = 0; sample < 8 && overlappingUnits; sample += 1) {
    overlappingUnits = Math.min(overlappingUnits, await page.locator(".battle-unit").evaluateAll((nodes) => {
      const boxes = nodes.map((node) => ({ side: node.classList.contains("enemy") ? "enemy" : "ally", rect: node.getBoundingClientRect() }));
      let overlaps = 0;
      for (let left = 0; left < boxes.length; left += 1) for (let right = left + 1; right < boxes.length; right += 1) {
        if (boxes[left].side !== boxes[right].side) continue;
        const a = boxes[left].rect;
        const b = boxes[right].rect;
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 3 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 3) overlaps += 1;
      }
      return overlaps;
    }));
    if (overlappingUnits) await page.waitForTimeout(80);
  }
  assert(overlappingUnits <= 6, `20 对 10 开战后单位显示挤成大团：${overlappingUnits}组重叠`);
  await page.screenshot({ path: path.join(os.tmpdir(), "agentautomata-fifteen-day-20v10-combat.png"), fullPage: true });
  assert.deepEqual(pageErrors, [], `浏览器运行错误：${pageErrors.join(" | ")}`);

  console.log(JSON.stringify({
    result: "PASS",
    viewport: "1440x1000",
    openingDays: 15,
    freeGrindInventory: grindInventory,
    continuousRealGrindRounds: grindInventory - 1,
    riverCombatTriggered: true,
    combatResultReturnedToMap: true,
    massCombatUnitsRendered: 30,
    overlappingMassCombatUnits: overlappingUnits,
    pageErrors,
  }, null, 2));
  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
