export function escapeHtml(s=""){
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/\"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

export function jsonld(obj){
  return `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
}

export function okJson(data, init={}){
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type":"application/json; charset=utf-8", ...(init.headers||{}) }
  });
}

export function okHtml(html, init={}){
  return new Response(html, {
    ...init,
    headers: { "content-type":"text/html; charset=utf-8", ...(init.headers||{}) }
  });
}

/**
 * Cloudflare edge cache helper
 * - Adds: x-kib-cache (HIT/MISS)
 * - Stores in caches.default
 */
export async function edgeCache({ request, cacheKeyUrl, ttlSeconds=300, buildResponse }){
  const cache = caches.default;
  const cacheKey = new Request(cacheKeyUrl, request);

  let cached = await cache.match(cacheKey);
  if (cached){
    const res = new Response(cached.body, cached);
    res.headers.set("x-kib-cache", "HIT");
    res.headers.set("x-kib-cache-key", new URL(cacheKeyUrl).pathname + new URL(cacheKeyUrl).search);
    return res;
  }

  const res = await buildResponse();
  // ensure cache headers
  if (!res.headers.has("cache-control")){
    res.headers.set("cache-control", `public, max-age=${ttlSeconds}`);
  }
  res.headers.set("x-kib-cache", "MISS");
  res.headers.set("x-kib-cache-key", new URL(cacheKeyUrl).pathname + new URL(cacheKeyUrl).search);

  // Put a clone into cache
  await cache.put(cacheKey, res.clone());
  return res;
}
