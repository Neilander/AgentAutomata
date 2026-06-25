const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "genre-arena-attention-tree.json");
const outputPath = path.join(__dirname, "genre-arena-attention-report.md");

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const defaults = data.defaults;

function rawStrength(node) {
  const salience = node.salience ?? 0.5;
  const novelty = node.novelty ?? 0.3;
  const importance = node.importance ?? 0.5;
  const intentFit = node.intentFit ?? 0.5;
  const goalRelevance = node.goalRelevance ?? 0.5;
  const bottomUp = salience * novelty;
  const topDown = importance * intentFit * goalRelevance;
  return bottomUp * defaults.bottomUpWeight + topDown * defaults.topDownWeight;
}

function siblingCategoryPenalty(node, siblings) {
  if (!node.category) return 1;
  const same = siblings.filter((item) => item.category === node.category).length;
  if (same <= 1) return 1;
  return 1 / Math.pow(same, defaults.categoryDilution);
}

function siblingSimilarityPenalty(node, siblings) {
  if (!node.visualGroup) return 1;
  const same = siblings.filter((item) => item.visualGroup === node.visualGroup).length;
  if (same <= 1) return 1;
  return 1 / Math.pow(same, defaults.visualSimilarityDilution);
}

function densityPenalty(parent) {
  const children = parent.children || [];
  if (!children.length || parent.mode === "gestalt_feedback") return 1;
  const comfort = parent.childrenComfortLimit || children.length;
  if (children.length <= comfort) return 1;
  const over = children.length / comfort;
  return 1 / (1 + (over - 1) * 0.9);
}

function nodeStrength(node, siblings = [], parent = null) {
  const own = rawStrength(node);
  const categoryPenalty = siblingCategoryPenalty(node, siblings);
  const similarityPenalty = siblingSimilarityPenalty(node, siblings);
  const parentDensityPenalty = parent ? densityPenalty(parent) : 1;
  const strength = own * categoryPenalty * similarityPenalty * parentDensityPenalty;
  return { own, categoryPenalty, similarityPenalty, parentDensityPenalty, strength };
}

function allocate(node, attention, depth = 0, siblings = [], parent = null) {
  const strengthInfo = nodeStrength(node, siblings, parent);
  const analyzed = {
    ...node,
    depth,
    attention,
    strengthInfo,
    children: [],
    issues: [],
  };

  const thresholds = node.thresholds || {};
  if (thresholds.min != null && attention < thresholds.min) {
    analyzed.issues.push(`below min attention ${thresholds.min}`);
  }
  if (thresholds.max != null && attention > thresholds.max) {
    analyzed.issues.push(`above max attention ${thresholds.max}`);
  }

  const children = node.children || [];
  if (!children.length) return analyzed;

  if (node.childrenComfortLimit && children.length > node.childrenComfortLimit) {
    analyzed.issues.push(`child count ${children.length} exceeds comfort limit ${node.childrenComfortLimit}`);
  }

  const childStrengths = children.map((child) => ({
    node: child,
    strengthInfo: nodeStrength(child, children, node),
  }));
  const denom = childStrengths.reduce((sum, item) => {
    return sum + Math.pow(Math.max(0.0001, item.strengthInfo.strength), defaults.attentionPower);
  }, 0);

  analyzed.children = childStrengths.map((item) => {
    const childAttention = attention * Math.pow(Math.max(0.0001, item.strengthInfo.strength), defaults.attentionPower) / denom;
    return allocate(item.node, childAttention, depth + 1, children, node);
  }).sort((a, b) => b.attention - a.attention);

  const minChildAttention = node.minChildAttention;
  if (minChildAttention != null) {
    const lowChildren = analyzed.children.filter((child) => child.attention < minChildAttention);
    if (lowChildren.length) {
      analyzed.issues.push(`${lowChildren.length}/${children.length} children below min child attention ${minChildAttention}`);
    }
  }

  return analyzed;
}

function flatten(node, out = []) {
  out.push(node);
  (node.children || []).forEach((child) => flatten(child, out));
  return out;
}

function renderTree(node) {
  const indent = "  ".repeat(node.depth);
  const issueText = node.issues.length ? ` [${node.issues.join("; ")}]` : "";
  const lines = [`${indent}- ${node.id}: ${node.attention.toFixed(1)}${issueText}`];
  node.children.forEach((child) => lines.push(...renderTree(child)));
  return lines;
}

function renderReport(root) {
  const flat = flatten(root);
  const top = root.children.slice().sort((a, b) => b.attention - a.attention);
  const leafNodes = flat.filter((node) => !node.children.length).sort((a, b) => b.attention - a.attention);
  const issueNodes = flat.filter((node) => node.issues.length);
  const lines = [];

  lines.push("# 4v4 Genre Arena Attention Report");
  lines.push("");
  lines.push(`- Intent: \`${data.intent}\``);
  lines.push("- Method: recursive attention tree. First analyze hierarchy, then allocate attention within each sibling group.");
  lines.push("");

  lines.push("## Page Hierarchy");
  lines.push("");
  lines.push("```text");
  lines.push(...renderTree(root));
  lines.push("```");
  lines.push("");

  lines.push("## Top-Level Attention");
  lines.push("");
  lines.push("| Region | Attention | Issues |");
  lines.push("| --- | ---: | --- |");
  top.forEach((node) => {
    lines.push(`| ${node.id} | ${node.attention.toFixed(1)} | ${node.issues.join("; ") || "ok"} |`);
  });
  lines.push("");

  lines.push("## Strongest Leaf Signals");
  lines.push("");
  lines.push("| Signal | Attention | Parent/Role | Issues |");
  lines.push("| --- | ---: | --- | --- |");
  leafNodes.slice(0, 15).forEach((node) => {
    lines.push(`| ${node.id} | ${node.attention.toFixed(2)} | ${node.type || ""} | ${node.issues.join("; ") || "ok"} |`);
  });
  lines.push("");

  lines.push("## Issues");
  lines.push("");
  if (!issueNodes.length) {
    lines.push("No issues by current rough thresholds.");
  } else {
    issueNodes.forEach((node) => {
      lines.push(`- ${node.id}: ${node.issues.join("; ")}`);
    });
  }
  lines.push("");

  lines.push("## Interpretation");
  lines.push("");
  lines.push("- The battle panel dominates the screen, which is good only after battle has started.");
  lines.push("- Under the current intent `select_matchup_then_watch_battle`, the preset selector needs enough attention before battle starts, but each preset card receives very little child-level attention because the lists contain many same-category cards.");
  lines.push("- The start button is important but competes inside a small topbar; if the player has not started yet, it may need stronger visual priority or relocation near the matchup selector.");
  lines.push("- The battlefield has large area attention, but its actual event layer depends on skill effects and floaters. If skill effects are weak, the battle panel becomes visually dominant but experientially underfed.");
  lines.push("- Detailed team config and debug bottom are correctly low for this intent, but they should become stronger in a separate tuning/debug intent.");
  lines.push("");

  lines.push("## Suggested UI Direction");
  lines.push("");
  lines.push("- Split states: before battle, make matchup selection plus start action the P0 flow; during battle, collapse selectors and make battle events P0.");
  lines.push("- Replace always-visible preset cards with compact rows plus selected matchup detail, or show fewer recommended presets at once.");
  lines.push("- Keep selected left/right teams visible, but reduce non-selected card text density.");
  lines.push("- Add stronger event signals inside battle: skill casts, shield spikes, poison ticks, execute moments, and result banners.");
  lines.push("");

  return lines.join("\n");
}

const root = allocate(data.root, defaults.attentionBudget);
fs.writeFileSync(outputPath, renderReport(root), "utf8");
console.log(`Wrote ${outputPath}`);
console.log(root.children.map((node) => `${node.id}:${node.attention.toFixed(1)}`).join(" | "));
