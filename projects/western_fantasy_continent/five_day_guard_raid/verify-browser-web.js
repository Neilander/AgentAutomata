"use strict";

const assert = require("node:assert/strict");
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
  await page.locator("#day-rail .day-step").first().waitFor();
  assert.equal(await page.locator("#day-rail .day-step").count(), 15, "浏览器没有渲染十五日时间轴");
  assert.equal(await page.locator("#ap-value").textContent(), "3", "首日行动点错误");
  assert.equal(await page.locator(".place-row").count(), 2, "默认区域应只列灰炉副本与已知炉门，而不是铺满所有事件");
  assert.equal(await page.locator(".area-marker em").count(), 4, "首屏应只在四个确有当前行动的区域标记事项数");
  await page.screenshot({ path: path.join(root, "fifteen-day-web-preview.png"), fullPage: true });

  const apBeforeGrind = await page.locator("#ap-value").textContent();
  await page.getByRole("button", { name: /连续战斗10次/ }).click();
  assert.equal(await page.locator("#ap-value").textContent(), apBeforeGrind, "免费刷装错误消耗了行动点");
  assert.equal(await page.locator("#inventory-count").textContent(), "11", "十连掉落没有进入背包");
  await page.getByRole("button", { name: /背包/ }).click();
  assert.equal(await page.locator(".inventory-cell").count(), 11, "背包网格没有渲染掉落");

  await page.locator("#end-day-button").click();
  assert.equal(await page.locator(".day-step.current i").textContent(), "2", "结束第一日后没有准确推进一天");
  await page.locator("#end-day-button").click();
  assert.equal(await page.locator(".day-step.current i").textContent(), "3", "结束第二日后没有准确推进一天");

  await page.locator('[data-area="河畔营地"]').click();
  await page.getByRole("button", { name: /正面袭击军需守卫/ }).click();
  await page.locator("#combat-view").waitFor({ state: "visible" });
  assert.equal(await page.locator("#scene-view").isHidden(), true, "进入战斗后场景层仍覆盖战斗层");
  assert.equal(await page.locator("#campaign-grid").getAttribute("class"), "campaign-grid combat-mode", "战斗没有切换为全宽布局");
  await page.locator(".battle-view-field").waitFor({ state: "visible", timeout: 10000 });
  await page.screenshot({ path: path.join(root, "fifteen-day-river-combat.png"), fullPage: true });

  await page.locator("#leave-combat").waitFor({ state: "visible", timeout: 45000 });
  const resultText = await page.locator("#combat-result").innerText();
  assert(resultText.includes("存活") && resultText.includes("伤害") && resultText.includes("治疗"), "战后没有提供可读结果");
  await page.locator("#leave-combat").click();
  await page.locator("#scene-view").waitFor({ state: "visible" });
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
  await page.getByRole("button", { name: /依托现有防线迎战（20对10）/ }).click();
  await page.locator(".battle-unit").first().waitFor({ state: "visible", timeout: 10000 });
  assert.equal(await page.locator(".battle-unit").count(), 30, "20 对 10 大战没有渲染完整三十个单位");
  const overlappingUnits = await page.locator(".battle-unit").evaluateAll((nodes) => {
    const boxes = nodes.map((node) => ({ side: node.classList.contains("enemy") ? "enemy" : "ally", rect: node.getBoundingClientRect() }));
    let overlaps = 0;
    for (let left = 0; left < boxes.length; left += 1) for (let right = left + 1; right < boxes.length; right += 1) {
      if (boxes[left].side !== boxes[right].side) continue;
      const a = boxes[left].rect;
      const b = boxes[right].rect;
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 3 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 3) overlaps += 1;
    }
    return overlaps;
  });
  assert.equal(overlappingUnits, 0, "20 对 10 初始编队仍有单位卡片重叠");
  await page.screenshot({ path: path.join(root, "fifteen-day-20v10-combat.png"), fullPage: true });
  assert.deepEqual(pageErrors, [], `浏览器运行错误：${pageErrors.join(" | ")}`);

  console.log(JSON.stringify({
    result: "PASS",
    viewport: "1440x1000",
    openingDays: 15,
    freeGrindInventory: 11,
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
