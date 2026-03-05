// public/assets/js/foods.js
// /foods/ 목록 페이지에서 D1 기반 사료 목록을 보여줍니다.
(async function () {
  const $ = (sel) => document.querySelector(sel);

  const listEl = $("#foodsList");
  const emptyEl = $("#foodsEmpty");
  const errorEl = $("#foodsError");
  const loadingEl = $("#foodsLoading");

  const show = (el, on) => { if (el) el.hidden = !on; };

  const escapeHtml = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  try {
    show(loadingEl, true);
    show(errorEl, false);
    show(emptyEl, false);

    const res = await fetch("/api/foods", { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error("API 오류: " + res.status);

    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    show(loadingEl, false);

    if (!items.length) {
      show(emptyEl, true);
      if (listEl) listEl.innerHTML = "";
      return;
    }

    if (!listEl) return;

    listEl.innerHTML = items.map((it) => {
      const name = escapeHtml(it?.name || "(이름 없음)");
      const brand = escapeHtml(it?.brand || "");
      const lifeStage = escapeHtml(it?.life_stage || "");
      const slug = String(it?.slug || "");
      const updated = escapeHtml(String(it?.updated_at || "").slice(0, 10));

      const cp = num(it?.crude_protein);
      const cf = num(it?.crude_fat);
      const mo = num(it?.moisture);

      return `
        <div class="card" style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
            <div>
              <div style="font-weight:1000;letter-spacing:-.2px;font-size:16px;line-height:1.2;margin:0 0 4px">${name}</div>
              <div class="small" style="opacity:.75">${brand}${lifeStage ? ` · ${lifeStage}` : ``}</div>
            </div>
            <div class="small" style="opacity:.65;text-align:right;white-space:nowrap">
              ${updated ? `업데이트<br>${updated}` : ""}
            </div>
          </div>

          <div class="row" style="gap:8px;flex-wrap:wrap">
            <span class="badge">조단백 ${cp}%</span>
            <span class="badge">조지방 ${cf}%</span>
            <span class="badge">수분 ${mo}%</span>
          </div>

          <div class="row" style="gap:8px;flex-wrap:wrap">
            <a class="btn btn--brand" href="/food/${encodeURIComponent(slug)}">상세 보기</a>
            <a class="btn" href="/edit.html?slug=${encodeURIComponent(slug)}">수정</a>
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    show(loadingEl, false);
    show(emptyEl, false);
    if (listEl) listEl.innerHTML = "";
    show(errorEl, true);
    if (errorEl) errorEl.textContent = "목록을 불러오지 못했어요. " + (err?.message || "");
  }
})();
