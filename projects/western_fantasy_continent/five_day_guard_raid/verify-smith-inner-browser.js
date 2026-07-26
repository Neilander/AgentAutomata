"use strict";

const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const URL = process.env.FIFTEEN_DAY_WEB_URL || "http://127.0.0.1:3777/five_day_guard_raid/";
const SAVE_KEY = "infinite_loot_fifteen_day_web_v1";

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--disable-gpu"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(URL, { waitUntil: "load" });
    await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
    await page.reload({ waitUntil: "load" });

    assert.equal(await page.getByText("灰炉内环", { exact: true }).count(), 0, "未完成铁匠任务时提前泄露了内环");

    await page.evaluate((key) => {
      const state = window.FIFTEEN_DAY_DEMO.createInitialState("browser-smith-unlock");
      state.day = 2;
      state.flags.smithPromise = true;
      state.nodes.smith_intro = { resolved: false, option: "promise" };
      for (let index = 0; index < 3; index += 1) state.inventory.push({ id: `browser_plain_${index}`, name: `普通武器${index + 1}`, slot: "weapon", slotLabel: "武器", rarity: "普通", power: 5, identityTags: [], source: "浏览器回归" });
      localStorage.setItem(key, JSON.stringify(state));
    }, SAVE_KEY);
    await page.reload({ waitUntil: "load" });
    await page.locator(".map-node", { hasText: "铁匠的试炉" }).click();
    const apBefore = await page.locator("#ap-outside-value").textContent();
    await page.getByRole("button", { name: /把三把普通武器交给铁匠/ }).click();

    await page.locator("#result-dialog").waitFor({ state: "visible" });
    assert((await page.locator("#result-body").textContent()).includes("灰炉内环已经可以进入"), "铁匠结果弹窗没有显示实际解锁结果");
    assert.equal(Number(apBefore) - Number(await page.locator("#ap-outside-value").textContent()), 1, "铁匠事件没有正确消耗一个行动点");
    assert.equal(await page.getByText("灰炉内环", { exact: true }).count(), 1, "完成试炉后地图没有立即出现灰炉内环");
    await page.locator("#result-confirm").click();
    await page.locator("#result-dialog").waitFor({ state: "hidden" });
    await page.getByRole("button", { name: /灰炉内环/ }).click();
    assert.equal(await page.locator(".action-button.grind-action").count(), 3, "内环没有提供三档真实刷装战斗");
    const apBeforeGrind = await page.locator("#ap-outside-value").textContent();
    await page.getByRole("button", { name: /LV1 · 余火甬道/ }).click();
    await page.locator("#grind-battle-mount .battle-view-field").waitFor({ state: "visible", timeout: 10000 });
    await page.locator("#stop-grind").click();
    await page.locator("[data-grind-leave]").waitFor({ state: "visible", timeout: 45000 });
    await page.locator("[data-grind-leave]").click();
    assert.equal(await page.locator("#ap-outside-value").textContent(), apBeforeGrind, "内环刷装错误消耗了行动点");
    await page.reload({ waitUntil: "load" });
    assert.equal(await page.getByText("灰炉内环", { exact: true }).count(), 1, "保存并刷新后内环解锁消失");

    await page.evaluate((key) => {
      const oldState = window.FIFTEEN_DAY_DEMO.createInitialState("browser-old-smith-save");
      oldState.day = 3;
      oldState.flags.smithForged = true;
      localStorage.setItem(key, JSON.stringify(oldState));
    }, SAVE_KEY);
    await page.reload({ waitUntil: "load" });
    assert.equal(await page.getByText("灰炉内环", { exact: true }).count(), 1, "旧存档迁移后没有补开灰炉内环");
    await page.getByRole("button", { name: "记录" }).click();
    assert((await page.locator("#dock-content").textContent()).includes("灰炉内环已经开放"), "旧存档迁移没有给玩家可见反馈");
    assert.deepEqual(pageErrors, [], `浏览器页面错误：${pageErrors.join(" | ")}`);

    console.log(JSON.stringify({ result: "PASS", freshUnlock: true, immediateFeedback: true, realInnerCombat: true, freeInnerGrind: true, persistedAfterAction: true, oldSaveMigrated: true, initialLeak: false, pageErrors }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
