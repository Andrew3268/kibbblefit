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

export function calculateNutrientDensity(n = {}) {
  const protein = clampPercent(n.protein);
  const fat = clampPercent(n.fat);
  const fiber = clampPercent(n.fiber);
  const ash = clampPercent(n.ash);
  const moisture = clampPercent(n.moisture);
  const kcalPerKg = toNumber(n.kcalPerKg);

  const carbs = Math.max(0, 100 - protein - fat - fiber - ash - moisture);

  // kcal/kg가 0이면 계산 불가
  if (kcalPerKg <= 0) {
    return {
      asFed: {
        protein,
        fat,
        fiber,
        ash,
        moisture,
        carbs: round1(carbs)
      },
      density: {
        protein: 0,
        fat: 0,
        carbs: 0
      },
      formulaText: "(영양소 % × 10000) ÷ kcal/kg",
      note: "추정 칼로리 값이 없어 영양소 밀도를 계산할 수 없습니다."
    };
  }

  // 영양소 밀도 g/Mcal
  // 예: 단백질 38% -> 380 g/kg
  // 3630 kcal/kg -> 3.63 Mcal/kg
  // 380 / 3.63 = 104.7 g/Mcal
  const proteinDensity = (protein * 10000) / kcalPerKg;
  const fatDensity = (fat * 10000) / kcalPerKg;
  const carbsDensity = (carbs * 10000) / kcalPerKg;

  return {
    asFed: {
      protein,
      fat,
      fiber,
      ash,
      moisture,
      carbs: round1(carbs)
    },
    density: {
      protein: round1(proteinDensity),
      fat: round1(fatDensity),
      carbs: round1(carbsDensity)
    },
    formulaText: "(영양소 % × 10000) ÷ kcal/kg",
    note: "영양소 밀도는 1000kcal(Mcal)당 단백질·지방·탄수화물을 몇 g 섭취하게 되는지 보여주는 값입니다."
  };
}
