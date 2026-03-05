const $ = (id) => document.getElementById(id);

function slugify(str){
  return String(str||"")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-가-힣]/g, "")
    .replace(/\-+/g, "-");
}

function parseIngredients(raw){
  return String(raw||"").split(",").map(s=>s.trim()).filter(Boolean);
}

function n(v){
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

function updateSlugPreview(){
  const name = $("name").value.trim();
  $("slugPreview").value = name ? slugify(name) : "";
}

async function save(){
  const status = $("status");
  status.textContent = "저장 중…";

  const name = $("name").value.trim();
  const brand = $("brand").value.trim();
  const life_stage = $("life_stage").value.trim();

  if (!name){ status.textContent = "사료명을 입력해주세요."; return; }

  const slug = slugify(name);

  const payload = {
    slug,
    name,
    brand,
    life_stage,
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

  const res = await fetch("/api/foods", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(()=> ({}));
  if (!res.ok){
    status.textContent = (json?.message || "저장 실패") + " (콘솔 확인)";
    console.error(json);
    return;
  }

  status.textContent = "저장 완료! 이동합니다…";
  location.href = `/food/${encodeURIComponent(slug)}`;
}

$("name").addEventListener("input", updateSlugPreview);
$("saveBtn").addEventListener("click", save);
updateSlugPreview();
