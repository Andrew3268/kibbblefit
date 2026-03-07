export function calculateNutrition(n) {

  const protein = Number(n.protein || 0);
  const fat = Number(n.fat || 0);
  const fiber = Number(n.fiber || 0);
  const ash = Number(n.ash || 0);
  const moisture = Number(n.moisture || 0);
  const calcium = Number(n.calcium || 0);
  const phosphorus = Number(n.phosphorus || 0);

  // -----------------------------
  // 추정 탄수화물 (As-fed)
  // -----------------------------

  const carbsAF = Math.max(
    0,
    100 - protein - fat - fiber - ash - moisture
  );

  // -----------------------------
  // Dry Matter 계산
  // -----------------------------

  const dmFactor = moisture < 100 ? 100 / (100 - moisture) : 0;

  const dm = {
    protein: protein * dmFactor,
    fat: fat * dmFactor,
    fiber: fiber * dmFactor,
    ash: ash * dmFactor,
    calcium: calcium * dmFactor,
    phosphorus: phosphorus * dmFactor,
    carbs: carbsAF * dmFactor
  };

  return {
    asFed: {
      protein,
      fat,
      fiber,
      ash,
      moisture,
      calcium,
      phosphorus,
      carbs: carbsAF
    },
    dm
  };

}