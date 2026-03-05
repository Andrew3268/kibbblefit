import { okJson } from "../../_utils.js";

export async function onRequestGet({ env, params }){
  const slug = String(params.slug || "");
  if (!slug) return okJson({ message: "slug가 필요해요." }, { status: 400 });

  const row = await env.KIB_D1
    .prepare(`
      SELECT slug, name, brand, life_stage,
             crude_protein, crude_fat, calcium, phosphorus, ash, crude_fiber, moisture,
             ingredients_json, updated_at
      FROM foods
      WHERE slug = ?
    `)
    .bind(slug)
    .first();

  if (!row) return okJson({ message: "not_found" }, { status: 404 });

  return okJson({ item: row });
}

// Update – used by edit.html
export async function onRequestPut({ env, params, request }){
  const slug = String(params.slug || "");
  if (!slug) return okJson({ message: "slug가 필요해요." }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return okJson({ message: "JSON이 필요해요." }, { status: 400 });

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

  if (!name) return okJson({ message: "name은 필수예요." }, { status: 400 });

  const now = new Date().toISOString();

  await env.KIB_D1.prepare(`
    UPDATE foods
    SET name=?, brand=?, life_stage=?,
        crude_protein=?, crude_fat=?, calcium=?, phosphorus=?, ash=?, crude_fiber=?, moisture=?,
        ingredients_json=?, updated_at=?
    WHERE slug=?
  `).bind(
    name, brand, lifeStage,
    crudeProtein, crudeFat, calcium, phosphorus, ash, crudeFiber, moisture,
    JSON.stringify(ingredients),
    now,
    slug
  ).run();

  return okJson({ ok: true, slug });
}
