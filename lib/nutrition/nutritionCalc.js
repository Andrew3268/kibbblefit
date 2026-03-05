export function calculateNutrition(n = {}) {

  // -----------------------------
  // 안전한 숫자 변환
  // -----------------------------

  const protein = safeNum(n.protein);
  const fat = safeNum(n.fat);
  const fiber = safeNum(n.fiber);
  const ash = safeNum(n.ash);
  const moisture = clamp(safeNum(n.moisture), 0, 100);
  const calcium = safeNum(n.calcium);
  const phosphorus = safeNum(n.phosphorus);

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

  const dryMatter = 100 - moisture;

  const dmFactor = dryMatter > 0
    ? 100 / dryMatter
    : 0;

  const dm = {
    protein: protein * dmFactor,
    fat: fat * dmFactor,
    fiber: fiber * dmFactor,
    ash: ash * dmFactor,
    calcium: calcium * dmFactor,
    phosphorus: phosphorus * dmFactor,
    carbs: carbsAF * dmFactor
  };

  // -----------------------------
  // 반환
  // -----------------------------

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

// -----------------------------
// 안전한 숫자 변환
// -----------------------------

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// -----------------------------
// 범위 제한
// -----------------------------

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}