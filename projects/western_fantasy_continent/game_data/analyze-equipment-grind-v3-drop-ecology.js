const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const UI_FILE = path.join(ROOT, "equipment_grind_v3", "equipment-grind-simulator.js");
const OUT_DIR = path.join(ROOT, "design", "equipment_progression");
const OUT_JSON = path.join(OUT_DIR, "equipment-grind-v3-drop-ecology.json");
const OUT_MD = path.join(OUT_DIR, "equipment-grind-v3-drop-ecology.md");

const SAMPLE_CLEARS = Number(process.env.CLEARS || 200);

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const text = fs.readFileSync(UI_FILE, "utf8");
  const dungeons = extractConst(text, "DUNGEONS");
  const slots = extractConst(text, "SLOT_DATA");
  const rarities = extractConst(text, "RARITIES");
  const blocked = new Set(["physicalPower", "magicPower", "maxHp", "armor", "attackSpeed", "skillHaste"]);
  const rows = dungeons.map((dungeon) => analyzeDungeon(dungeon, slots, rarities, blocked));
  fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), sampleClears: SAMPLE_CLEARS, rows }, null, 2), "utf8");
  fs.writeFileSync(OUT_MD, renderMarkdown(rows), "utf8");
  printRows(rows);
}

function extractConst(text, name) {
  const patterns = [
    new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n  \\]);`),
    new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n  \\});`),
  ];
  const match = patterns.map((pattern) => text.match(pattern)).find(Boolean);
  if (!match) throw new Error(`Cannot find ${name}.`);
  return Function(`"use strict"; return ${match[1]};`)();
}

function analyzeDungeon(dungeon, slots, rarities, blocked) {
  const rng = seededRandom(`drop-ecology|d${dungeon.level}`);
  const rarityCounts = Object.fromEntries(rarities.map((rarity) => [rarity.id, 0]));
  const affixCounts = {};
  let totalItems = 0;
  let totalAffixes = 0;
  let itemTopTwoShareSum = 0;
  let repeatedItemCount = 0;
  for (let clear = 0; clear < SAMPLE_CLEARS; clear += 1) {
    for (let i = 0; i < (dungeon.dropCount || 1); i += 1) {
      const slotKey = pick(Object.keys(slots), rng);
      const slot = slots[slotKey];
      const rarity = chooseRarity(dungeon.rarity, rarities, rng);
      rarityCounts[rarity.id] += 1;
      totalItems += 1;
      const pool = slot.affixPool.filter((stat) => !blocked.has(stat));
      const focusStats = pickMany(pool, Math.min(2, pool.length), rng);
      const focusSlots = focusStats.length ? Math.floor(rarity.affixes * 0.5) : 0;
      const itemAffixCounts = {};
      for (let index = 0; index < rarity.affixes; index += 1) {
        const stat = index < focusSlots ? focusStats[index % focusStats.length] : pick(pool, rng);
        affixCounts[stat] = (affixCounts[stat] || 0) + 1;
        itemAffixCounts[stat] = (itemAffixCounts[stat] || 0) + 1;
        totalAffixes += 1;
      }
      const itemCounts = Object.values(itemAffixCounts).sort((a, b) => b - a);
      itemTopTwoShareSum += (itemCounts[0] || 0) + (itemCounts[1] || 0);
      if (itemCounts.some((count) => count > 1)) repeatedItemCount += 1;
    }
  }
  const topAffixes = Object.entries(affixCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([stat, count]) => ({ stat, count, share: round(count / Math.max(1, totalAffixes), 3) }));
  return {
    level: dungeon.level,
    name: dungeon.name,
    dropCount: dungeon.dropCount,
    totalItems,
    rarityPer100Clears: Object.fromEntries(Object.entries(rarityCounts).map(([key, value]) => [key, round((value / SAMPLE_CLEARS) * 100, 2)])),
    rarityShare: Object.fromEntries(Object.entries(rarityCounts).map(([key, value]) => [key, round(value / Math.max(1, totalItems), 3)])),
    itemTopTwoAffixShare: round(itemTopTwoShareSum / Math.max(1, totalAffixes), 3),
    repeatedItemShare: round(repeatedItemCount / Math.max(1, totalItems), 3),
    topAffixes,
  };
}

function chooseRarity(table, rarities, rng) {
  const roll = rng();
  let cursor = 0;
  for (const rarity of rarities) {
    cursor += table[rarity.id] || 0;
    if (roll <= cursor) return rarity;
  }
  return rarities.filter((rarity) => table[rarity.id]).pop() || rarities[0];
}

function renderMarkdown(rows) {
  const lines = [
    "# Equipment Grind V3 Drop Ecology",
    "",
    `Sample: ${SAMPLE_CLEARS} clears per dungeon.`,
    "",
    "| D | Drops | Rare/100 | Epic/100 | Legendary/100 | Mythic/100 | Item top2 share | Repeated item share | Top affixes |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---|",
  ];
  for (const row of rows) {
    lines.push(`| D${row.level} | ${row.dropCount} | ${row.rarityPer100Clears.rare || 0} | ${row.rarityPer100Clears.epic || 0} | ${row.rarityPer100Clears.legendary || 0} | ${row.rarityPer100Clears.mythic || 0} | ${Math.round(row.itemTopTwoAffixShare * 100)}% | ${Math.round(row.repeatedItemShare * 100)}% | ${row.topAffixes.slice(0, 4).map((item) => `${item.stat} ${Math.round(item.share * 100)}%`).join(", ")} |`);
  }
  lines.push("", "## Notes", "");
  lines.push("- Rarity values are expected item counts per 100 successful clears, not percentages per item.");
  lines.push("- Item top2 share measures concentration inside each item, not dungeon-specific themes.");
  lines.push("- Repeated item share measures how often an item has at least one duplicated affix type after focused random generation.");
  return `${lines.join("\n")}\n`;
}

function printRows(rows) {
  console.log("| D | drops | rare/100 | epic/100 | leg/100 | mythic/100 | top2 | repeated |");
  console.log("|---|---:|---:|---:|---:|---:|---:|---:|");
  for (const row of rows) {
    console.log(`| D${row.level} | ${row.dropCount} | ${row.rarityPer100Clears.rare || 0} | ${row.rarityPer100Clears.epic || 0} | ${row.rarityPer100Clears.legendary || 0} | ${row.rarityPer100Clears.mythic || 0} | ${Math.round(row.itemTopTwoAffixShare * 100)}% | ${Math.round(row.repeatedItemShare * 100)}% |`);
  }
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

function pickMany(items, count, rng) {
  const pool = [...items];
  const output = [];
  while (output.length < count && pool.length) output.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return output;
}

function seededRandom(seedText) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value, digits = 2) {
  return Number((Number(value) || 0).toFixed(digits));
}

if (require.main === module) main();
