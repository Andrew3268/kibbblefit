const $ = (id) => document.getElementById(id);

function qs(name){
  return new URLSearchParams(location.search).get(name);
}

function parseIngredients(raw){
  return String(raw||"").split(",").map(s=>s.trim()).filter(Boolean);
}

function n(v){
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

async function load(){
  const status = $("status");
  const slug = qs("slug");
  if (!slug){
    status.textContent = "slug 파라미터가 없어요. 예: /edit.html?slug=test-food";
    return;
  }

  status.textContent = "불러오는 중…";

  const res = await fetch(`/api/foods/${encodeURIComponent(slug)}`);
  const json = await res.json().catch(()=> ({}));
  if (!res.ok){
    status.textContent = "불러오기 실패: " + (json?.message || res.status);
    console.error(json);
    return;
  }

  const item = json.item;

  $("slug").value = item.slug || "";
  $("updated_at").value = item.updated_at || "";
  $("name").value = item.name || "";
  $("brand").value = item.brand || "";
  $("life_stage").value = item.life_stage || "";

  $("crude_protein").value = item.crude_protein ?? 0;
  $("crude_fat").value = item.crude_fat ?? 0;
  $("calcium").value = item.calcium ?? 0;
  $("phosphorus").value = item.phosphorus ?? 0;
  $("ash").value = item.ash ?? 0;
  $("crude_fiber").value = item.crude_fiber ?? 0;
  $("moisture").value = item.moisture ?? 0;

  // ingredients_json is stored as string in row
  let ingredients = [];
  try { ingredients = JSON.parse(item.ingredients_json || "[]"); } catch { ingredients = []; }
  $("ingredients").value = Array.isArray(ingredients) ? ingredients.join(", ") : "";

  $("viewBtn").href = `/food/${encodeURIComponent(slug)}`;

  status.textContent = "불러오기 완료";
}

async function save(){
  const status = $("status");
  const slug = $("slug").value;
  if (!slug){ status.textContent = "slug가 없어요."; return; }

  status.textContent = "저장 중…";

  const payload = {
    name: $("name").value.trim(),
    brand: $("brand").value.trim(),
    life_stage: $("life_stage").value.trim(),
    ga: {
      crude_protein: n($("crude_protein").value),
      crude_fat: n($("crude_fat").value),
      calcium: n($("calcium").value),
      phosphorus: n($("phosphorus").value),
      ash: n($("ash").value),
      crude_fiber: n($("crude_fiber").value),
      moisture: n($("moisture").value),
    },
    ingredients: parseIngredients($("ingredients").value),
  };

  const res = await fetch(`/api/foods/${encodeURIComponent(slug)}` , {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(()=> ({}));
  if (!res.ok){
    status.textContent = "저장 실패: " + (json?.message || res.status);
    console.error(json);
    return;
  }

  status.textContent = "저장 완료! 상세 페이지에서 새로고침해 보세요.";

  // updated_at 갱신된 값을 다시 로딩
  await load();
}

$("saveBtn").addEventListener("click", save);
load();
