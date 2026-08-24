"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

async function main() {
  const pageUrl = pathToFileURL(path.join(__dirname, "index.html")).href;
  const screenshotPath = process.env.WALKTHROUGH_QA_SCREENSHOT || null;
  const chromeCandidates = [
    process.env.WALKTHROUGH_CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const pageErrors = [];
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto(pageUrl, { waitUntil: "load" });
    await page.waitForSelector(".step-button.is-active");
    assert.equal(await page.locator(".step-button").count(), 10);
    assert.equal(await page.locator(".flow-node").count(), 6);
    assert.match(await page.locator("#detail-title").textContent(), /B 列.*放置.*骰/);

    await page.locator("#next-button").click();
    assert.match(await page.locator("#detail-title").textContent(), /34 项/);
    assert.equal(await page.locator("#step-counter").textContent(), "2 / 10");

    await page.locator('[data-step-index="6"]').click();
    assert.match(await page.locator("#detail-title").textContent(), /拒绝.*经过箭头/);
    assert.equal(await page.locator(".rejection-row").count(), 1);

    await page.locator('[data-step-index="9"]').click();
    assert.match(await page.locator("#output-title").textContent(), /city HP 3 → 2/);
    assert.match(await page.locator("#imagined-health").textContent(), /2 \/ 3/);
    assert.match(await page.locator("#observed-health").textContent(), /3 \/ 3/);

    await page.locator('[data-stage-id="attention"]').click();
    assert.equal(await page.locator("#step-counter").textContent(), "2 / 10");
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator("#step-counter").textContent(), "3 / 10");

    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.equal(desktopOverflow, false, "desktop layout has horizontal overflow");

    if (screenshotPath) {
      await page.locator('[data-step-index="6"]').click();
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-step-index="9"]').click();
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.equal(mobileOverflow, false, "mobile layout has horizontal overflow");

    assert.deepEqual(pageErrors, []);
    assert.deepEqual(consoleErrors, []);
    console.log(JSON.stringify({
      result: "PASS",
      steps: 10,
      flowNodes: 6,
      desktopOverflow,
      mobileOverflow,
      executablePath: executablePath || "playwright-managed",
      screenshotPath,
    }));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
