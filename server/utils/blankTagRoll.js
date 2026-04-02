export const BLANK_TAG_ENUM = [
  "Screen Stars",
  "Hanes Beefy-T",
  "Fruit of the Loom",
  "Gildan",
  "Giant",
];

const TAG_WEIGHTS = [
  { tag: "Gildan", weight: 42 },
  { tag: "Fruit of the Loom", weight: 24 },
  { tag: "Hanes Beefy-T", weight: 20 },
  { tag: "Screen Stars", weight: 9 },
  { tag: "Giant", weight: 5 },
];

const TOTAL_WEIGHT = TAG_WEIGHTS.reduce((s, row) => s + row.weight, 0);

/** Weighted random blank / tag when a shirt is pulled (Gildan common, Giant rarest). */
export function rollBlankTag() {
  const x = Math.random() * TOTAL_WEIGHT;
  let cumulative = 0;
  for (const { tag, weight } of TAG_WEIGHTS) {
    cumulative += weight;
    if (x < cumulative) return tag;
  }
  return TAG_WEIGHTS[TAG_WEIGHTS.length - 1].tag;
}

const SINGLE_STITCH_TAGS = new Set(["Screen Stars", "Giant"]);

/**
 * Only Screen Stars and Giant may roll single-stitch (modest vintage odds).
 */
export function rollSingleStitch(tag) {
  if (!SINGLE_STITCH_TAGS.has(tag)) return false;
  return Math.random() < 0.12;
}
