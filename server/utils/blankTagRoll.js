export const BLANK_TAG_ENUM = [
  "Screen Stars",
  "Hanes Beefy-T",
  "Fruit of the Loom",
  "Gildan",
  "Giant",
];

/** Weights sum to 100. Screen Stars + Giant are stitch-eligible and deliberately bumped. */
const TAG_WEIGHTS = [
  { tag: "Gildan", weight: 28 },
  { tag: "Fruit of the Loom", weight: 16 },
  { tag: "Hanes Beefy-T", weight: 16 },
  { tag: "Screen Stars", weight: 22 },
  { tag: "Giant", weight: 18 },
];

const TOTAL_WEIGHT = TAG_WEIGHTS.reduce((s, row) => s + row.weight, 0);

/** Weighted random blank / tag when a shirt is pulled. */
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
 * Eligible-tags weight 40% of rolls; this chance makes ~1 in 5 packs (3 cards)
 * get at least one single stitch: 1 - (1 - 0.4×0.18)³ ≈ 20%.
 */
const SINGLE_STITCH_CHANCE_IF_ELIGIBLE = 0.18;

export function rollSingleStitch(tag) {
  if (!SINGLE_STITCH_TAGS.has(tag)) return false;
  return Math.random() < SINGLE_STITCH_CHANCE_IF_ELIGIBLE;
}
