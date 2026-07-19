function hash32(text) {
  let hash = 2166136261;
  for (const char of String(text || "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function visibleActionId(actionKey) {
  const key = String(actionKey || "").trim();
  return key
    ? `visible_action:${hash32(key).toString(16).padStart(8, "0")}`
    : null;
}

function visibleCharacterRef(stableCharacterId) {
  const stableId = String(stableCharacterId || "").trim();
  return stableId
    ? {
      refId: `visible_character:${hash32(stableId).toString(16).padStart(8, "0")}`,
      side: "left",
      kind: "character",
    }
    : null;
}

module.exports = {
  hash32,
  visibleActionId,
  visibleCharacterRef,
};
