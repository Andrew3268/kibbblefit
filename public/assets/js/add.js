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

async function save(){
  const status = $("status");
  status.textContent = "저장 중…";

  const name = $("name").value.trim();
  const brand = $("brand").value.trim();
  const protein = Number($("protein").value || 0);
  const fat = Number($("fat").value || 0);
  const carb = Number($("carb").value || 0);
  const ingredients = parseIngredients($("ingredients").value);

  if (!name){ status.textContent = "사료 이름을 입력해주세요."; return; }

  const slug = slugify(name);
  const payload = { slug, name, brand, nutrition_dm: { protein, fat, carb }, ingredients };

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

$("saveBtn").addEventListener("click", save);
