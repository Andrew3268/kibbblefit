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

  return okJson({ ok: true, slug });
}
