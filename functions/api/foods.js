import { okJson } from "../_utils.js";

export async function onRequestGet({ env }){
  const rows = await env.KIB_D1
    .prepare("SELECT slug, name, brand, protein_dm, fat_dm, carb_dm, updated_at FROM foods ORDER BY updated_at DESC LIMIT 200")
    .all();
  return okJson({ items: rows.results || [] });
}

export async function onRequestPost({ env, request }){
  const body = await request.json().catch(() => null);
  if (!body) return okJson({ message: "JSON이 필요해요." }, { status: 400 });

  const slug = String(body.slug || "").trim();

  const url = new URL(request.url);
  const origin = url.origin;
  const cache = caches.default;
  const metaKey = new Request(`${origin}/__meta/food/${encodeURIComponent(slug)}`, { method: "GET" });


  // ✅ 기존 버전(있다면) 읽어두기 → 업데이트 후 즉시 캐시 무효화에 사용
  let prevVersion = "";
  try {
    const metaHit = await cache.match(metaKey);
    if (metaHit) prevVersion = (await metaHit.text()).trim();
    } catch (_) {}

  const name = String(body.name || "").trim();
  const brand = String(body.brand || "").trim();
  const n = body.nutrition_dm || {};
  const protein = Number(n.protein || 0);
  const fat = Number(n.fat || 0);
  const carb = Number(n.carb || 0);
  const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];

  if (!slug || !name) return okJson({ message: "slug, name은 필수예요." }, { status: 400 });

  const now = new Date().toISOString();

  await env.KIB_D1.prepare(`
    INSERT INTO foods (slug, name, brand, protein_dm, fat_dm, carb_dm, ingredients_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name=excluded.name,
      brand=excluded.brand,
      protein_dm=excluded.protein_dm,
      fat_dm=excluded.fat_dm,
      carb_dm=excluded.carb_dm,
      ingredients_json=excluded.ingredients_json,
      updated_at=excluded.updated_at
  `).bind(slug, name, brand, protein, fat, carb, JSON.stringify(ingredients), now).run();


  // ✅ 새 버전 저장 + 이전 버전 HTML 캐시 삭제(즉시 무효화)
  const nextVersion = now;

  try {
    // meta 업데이트(최신 버전)
    await cache.put(
      metaKey,
      new Response(nextVersion, { headers: { "cache-control": "public, max-age=0, s-maxage=86400" } })
    );

    // 이전 버전 캐시 삭제
    if (prevVersion) {
      const oldHtmlKey = new Request(`${origin}/food/${encodeURIComponent(slug)}?v=${encodeURIComponent(prevVersion)}`, { method: "GET" });
      await cache.delete(oldHtmlKey);
    }

    // 혹시 남아있을 수 있는 무버전 캐시도 삭제
    const plainKey = new Request(`${origin}/food/${encodeURIComponent(slug)}`, { method: "GET" });
    await cache.delete(plainKey);
    } catch (_) {}

  return okJson({ ok: true, slug, updated_at: nextVersion });

}
