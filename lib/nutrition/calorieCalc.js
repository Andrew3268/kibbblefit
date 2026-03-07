function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clampPercent(v) {
  const n = toNumber(v);
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export function calculateEstimatedCalories(n = {}) {
  const protein = clampPercent(n.protein);
  const fat = clampPercent(n.fat);
  const fiber = clampPercent(n.fiber);
  const ash = clampPercent(n.ash);
  const moisture = clampPercent(n.moisture);

  const carbs = Math.max(0, 100 - protein - fat - fiber - ash - moisture);

  // Modified Atwater Factors for pet food
  const kcalPer100g = (3.5 * protein) + (8.5 * fat) + (3.5 * carbs);
  const kcalPerKg = kcalPer100g * 10;

  return {
    asFed: {
      protein,
      fat,
      fiber,
      ash,
      moisture,
      carbs
    },
    factors: {
      protein: 3.5,
      fat: 8.5,
      carbs: 3.5
    },
    kcalPer100g,
    kcalPerKg,
    formulaText: `10 × ((단백질 × 3.5) + (지방 × 8.5) + (탄수화물 × 3.5))`,
    note: "수분을 포함한 라벨값(As-fed %) 기준 추정 칼로리입니다."
  };
}
