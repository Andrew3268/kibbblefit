import { okJson } from "../_utils.js";

export async function onRequestGet({ env }){
  const rows = await env.KIB_D1
    .prepare(`
      SELECT slug, name, brand, life_stage,
             crude_protein, crude_fat, calcium, phosphorus, ash, crude_fiber, moisture,
             updated_at
      FROM foods
      ORDER BY updated_at DESC
      LIMIT 200
    `)
    .all();

  return okJson({ items: rows.results || [] });
}

// Create (or upsert) – used by add.html
export async function onRequestPost({ env, request }){
  const body = await request.json().catch(() => null);
  if (!body) return okJson({ message: "JSON이 필요해요." }, { status: 400 });

  const slug = String(body.slug || "").trim();
  const name = String(body.name || "").trim();
  const brand = String(body.brand || "").trim();
  const lifeStage = String(body.life_stage || "").trim();

  const ga = body.ga || {};
  const crudeProtein = Number(ga.crude_protein || 0);
  const crudeFat = Number(ga.crude_fat || 0);
  const calcium = Number(ga.calcium || 0);
  const phosphorus = Number(ga.phosphorus || 0);
  const ash = Number(ga.ash || 0);
  const crudeFiber = Number(ga.crude_fiber || 0);
  const moisture = Number(ga.moisture || 0);

  const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];

  if (!slug || !name) return okJson({ message: "slug, name은 필수예요." }, { status: 400 });

  const now = new Date().toISOString();

  await env.KIB_D1.prepare(`
    INSERT INTO foods (
      slug, name, brand, life_stage,
      crude_protein, crude_fat, calcium, phosphorus, ash, crude_fiber, moisture,
      ingredients_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name=excluded.name,
      brand=excluded.brand,
      life_stage=excluded.life_stage,
      crude_protein=excluded.crude_protein,
      crude_fat=excluded.crude_fat,
      calcium=excluded.calcium,
      phosphorus=excluded.phosphorus,
      ash=excluded.ash,
      crude_fiber=excluded.crude_fiber,
      moisture=excluded.moisture,
      ingredients_json=excluded.ingredients_json,
      updated_at=excluded.updated_at
  `).bind(
    slug, name, brand, lifeStage,
    crudeProtein, crudeFat, calcium, phosphorus, ash, crudeFiber, moisture,
    JSON.stringify(ingredients),
    now
  ).run();

  return okJson({ ok: true, slug });
}
