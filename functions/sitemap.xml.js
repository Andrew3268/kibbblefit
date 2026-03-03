export async function onRequestGet({ env, request }){
  const origin = new URL(request.url).origin;

  const rows = await env.KIB_D1
    .prepare("SELECT slug, updated_at FROM foods ORDER BY updated_at DESC LIMIT 50000")
    .all();

  const staticUrls = [
    `${origin}/`,
    `${origin}/foods/`,
    `${origin}/tools/`,
    `${origin}/about/`
  ].map(u => `<url><loc>${u}</loc></url>`).join("");

  const urls = (rows.results || []).map(r => {
    const loc = `${origin}/food/${encodeURIComponent(r.slug)}`;
    const lastmod = String(r.updated_at || "").slice(0,10);
    return `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "content-type":"application/xml; charset=utf-8", "cache-control":"public, max-age=300" }
  });
}
