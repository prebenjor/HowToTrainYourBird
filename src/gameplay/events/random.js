export function weightedRandomChoice(items, random = Math.random) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }
  const totalWeight = items.reduce((sum, item) => {
    const weight = typeof item.weight === "number" ? item.weight : 1;
    return sum + Math.max(0, weight);
  }, 0);
  if (totalWeight <= 0) {
    return null;
  }
  let roll = random() * totalWeight;
  for (const item of items) {
    const weight = Math.max(0, typeof item.weight === "number" ? item.weight : 1);
    if (weight === 0) {
      continue;
    }
    roll -= weight;
    if (roll <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
}
