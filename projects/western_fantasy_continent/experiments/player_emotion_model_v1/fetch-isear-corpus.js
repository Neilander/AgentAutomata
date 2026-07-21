const fs = require("fs");
const path = require("path");

const DATASET = "savalera/isear-from-original";
const CONFIG = "filtered";
const SOURCE_SPLITS = ["train", "validation", "test"];
const PAGE_SIZE = 100;
const OUTPUT = path.join(__dirname, "data", "raw", "isear", "filtered-api.jsonl");

async function fetchJson(url, attempt = 1) {
  try {
    const response = await fetch(url);
    if (response.ok) return response.json();
    if (attempt >= 5) throw new Error(`HTTP ${response.status}: ${url}`);
  } catch (error) {
    if (attempt >= 5) {
      const cause = error?.cause ? `; cause=${error.cause.message || error.cause}` : "";
      throw new Error(`${error.message}${cause}; url=${url}`);
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
  return fetchJson(url, attempt + 1);
}

async function fetchSplit(split) {
  const first = await fetchPage(split, 0, 1);
  const total = first.num_rows_total;
  const rows = [];
  for (let offset = 0; offset < total; offset += PAGE_SIZE) {
    const page = await fetchPage(split, offset, PAGE_SIZE);
    rows.push(...page.rows.map((entry) => ({
      sourceDatasetSplit: split,
      ...entry.row,
    })));
  }
  if (rows.length !== total) {
    throw new Error(`${split}: expected ${total} rows, got ${rows.length}`);
  }
  return rows;
}

async function fetchPage(split, offset, length) {
  const query = new URLSearchParams({
    dataset: DATASET,
    config: CONFIG,
    split,
    offset: String(offset),
    length: String(length),
  });
  return fetchJson(`https://datasets-server.huggingface.co/rows?${query}`);
}

async function main() {
  const allRows = [];
  const counts = {};
  for (const split of SOURCE_SPLITS) {
    const rows = await fetchSplit(split);
    counts[split] = rows.length;
    allRows.push(...rows);
  }
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${allRows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
  console.log(JSON.stringify({
    dataset: DATASET,
    config: CONFIG,
    rows: allRows.length,
    sourceSplitCounts: counts,
    output: OUTPUT,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
