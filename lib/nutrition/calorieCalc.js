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

function round1(n) {
  return Math.round(n * 10) / 10;
}

export function calculateEstimatedCalories(n = {}) {
  const protein = clampPercent(n.protein);
  const fat = clampPercent(n.fat);
  const fiber = clampPercent(n.fiber);
  const ash = clampPercent(n.ash);
  const moisture = clampPercent(n.moisture);

  const carbs = Math.max(0, 100 - protein - fat - fiber - ash - moisture);

  // Modified Atwater Factors (AAFCO에서 널리 사용하는 반려동물 사료 추정 방식)
  const proteinFactor = 3.5;
  const fatFactor = 8.5;
  const carbsFactor = 3.5;

  // kcal / 100g
  const proteinKcalPer100g = protein * proteinFactor;
  const fatKcalPer100g = fat * fatFactor;
  const carbsKcalPer100g = carbs * carbsFactor;

  const kcalPer100g = proteinKcalPer100g + fatKcalPer100g + carbsKcalPer100g;
  const kcalPerKg = kcalPer100g * 10;

  const proteinPct = kcalPer100g > 0 ? (proteinKcalPer100g / kcalPer100g) * 100 : 0;
  const fatPct = kcalPer100g > 0 ? (fatKcalPer100g / kcalPer100g) * 100 : 0;
  const carbsPct = kcalPer100g > 0 ? (carbsKcalPer100g / kcalPer100g) * 100 : 0;

  return {
    asFed: {
      protein,
      fat,
      fiber,
      ash,
      moisture,
      carbs: round1(carbs)
    },

    factors: {
      protein: proteinFactor,
      fat: fatFactor,
      carbs: carbsFactor
    },

    kcal: {
      proteinPer100g: round1(proteinKcalPer100g),
      fatPer100g: round1(fatKcalPer100g),
      carbsPer100g: round1(carbsKcalPer100g),
      totalPer100g: round1(kcalPer100g),
      totalPerKg: Math.round(kcalPerKg)
    },

    pfc: {
      protein: {
        kcalPer100g: round1(proteinKcalPer100g),
        ratio: round1(proteinPct)
      },
      fat: {
        kcalPer100g: round1(fatKcalPer100g),
        ratio: round1(fatPct)
      },
      carbs: {
        kcalPer100g: round1(carbsKcalPer100g),
        ratio: round1(carbsPct)
      }
    },

    // 기존 코드 호환용
    kcalPer100g: round1(kcalPer100g),
    kcalPerKg: Math.round(kcalPerKg),

    formulaText: `10 × ((단백질 × 3.5) + (지방 × 8.5) + (탄수화물 × 3.5))`,
    note: "칼로리 계산은 AAFCO에서 널리 사용하는 Modified Atwater 기준 추정 방식입니다."
  };
}
