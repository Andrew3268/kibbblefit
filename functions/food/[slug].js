import { escapeHtml, jsonld } from "../_utils.js";

export async function onRequestGet({ params, env, request }){
  const slug = String(params.slug || "");
  if (!slug) return new Response("Not Found", { status: 404 });

const url = new URL(request.url);
const origin = url.origin;
const cache = caches.default;

// -------------------------
// ✅ Edge Cache 전략
// - metaKey: slug의 최신 updated_at(=버전)을 저장
// - htmlKey: /food/<slug>?v=<version> 형태로 HTML을 저장
// - 업데이트(POST) 시 meta 업데이트 + 이전 버전 htmlKey 삭제로 즉시 무효화
// -------------------------
const metaKey = new Request(`${origin}/__meta/food/${encodeURIComponent(slug)}`, { method: "GET" });

// URL에 v가 있으면(직접 버전 지정) 그 값을 우선 사용
let version = url.searchParams.get("v") || "";

if (!version) {
  const metaHit = await cache.match(metaKey);
  if (metaHit) version = (await metaHit.text()).trim();
}

const cacheKeyUrl = version
  ? `${origin}/food/${encodeURIComponent(slug)}?v=${encodeURIComponent(version)}`
  : `${origin}/food/${encodeURIComponent(slug)}`;

const htmlCacheKey = new Request(cacheKeyUrl, { method: "GET" });

// ✅ 캐시 HIT이면 DB 조회 없이 바로 응답
const cached = await cache.match(htmlCacheKey);
if (cached) {
  const res = new Response(cached.body, cached);
  res.headers.set("x-kib-cache", "HIT");
  return res;
}
// (여기부터 MISS → DB 조회 후 HTML 생성)

  const row = await env.KIB_D1
    .prepare("SELECT slug, name, brand, protein_dm, fat_dm, carb_dm, ingredients_json, updated_at FROM foods WHERE slug = ?")
    .bind(slug)
    .first();

  if (!row){
    // ✅ 404는 검색 노출을 막는 편이 안전
    return new Response(renderNotFound(slug, request), {
      status: 404,
      headers: { "content-type":"text/html; charset=utf-8" }
    });
  }

  const ingredients = safeJson(row.ingredients_json, []);

  // ✅ SEO 기본 문구 (원하면 여기 규칙을 확장해도 됨)
  const title = `${row.name} 분석 | 키블핏`;
  const desc  = `${row.name}의 보증성분(DM)과 원료 구성을 집사님 눈높이로 정리했어요.`;

  // ✅ Canonical: 절대 URL 권장
  const canonical = new URL(request.url);
  canonical.pathname = `/food/${encodeURIComponent(slug)}`;
  canonical.search = "";
  canonical.hash = "";

  const ogImage = getOgImageUrl(request);

  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- ✅ Title / Description -->
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}" />

  <!-- ✅ Canonical (절대 URL) -->
  <link rel="canonical" href="${escapeHtml(canonical.toString())}" />

  <!-- ✅ Robots -->
  <meta name="robots" content="index,follow" />
  <meta name="googlebot" content="index,follow" />

  <!-- ✅ Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="키블핏" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:url" content="${escapeHtml(canonical.toString())}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(`${row.name} 사료 분석 썸네일`)}" />

  <!-- ✅ Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

  <!-- ✅ Theme -->
  <meta name="theme-color" content="#5B7CFF" />

  <!-- ✅ Styles -->
  <link rel="stylesheet" href="/assets/css/app.css" />
  <link rel="stylesheet" href="/assets/css/components.css" />

  <!-- ✅ Structured Data (강화 버전) -->
  ${jsonld({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${row.name} 사료 분석`,
    "description": desc,
    "mainEntityOfPage": canonical.toString(),
    "dateModified": row.updated_at,
    "datePublished": row.updated_at,
    "author": { "@type": "Organization", "name": "키블핏" },
    "publisher": {
      "@type": "Organization",
      "name": "키블핏",
      "logo": { "@type": "ImageObject", "url": ogImage }
    },
    "image": [ogImage]
  })}
</head>

<body>
  ${sprite()}
  ${topbar()}

  <main class="container">
    <section class="card" style="display:flex;flex-direction:column;gap:10px">
      <div class="row">
        <span class="badge">SSR</span>
        <span class="badge">${escapeHtml(row.brand || "브랜드")}</span>
        <span class="badge">업데이트 ${escapeHtml(String(row.updated_at||"").slice(0,10) || "")}</span>
      </div>

      <h1 class="h1">${escapeHtml(row.name)}</h1>
      <p class="p">이 페이지는 요청 시 Functions가 DB에서 읽어 <b>HTML을 즉시 생성</b>합니다.</p>
    </section>

    <section class="grid grid--2" style="margin-top:14px">
      <section class="card" style="display:flex;flex-direction:column;gap:10px">
        <h2 class="h2">보증성분(DM, 샘플)</h2>
        ${kv("단백질(DM)", `${num(row.protein_dm)}%`)}
        ${kv("지방(DM)", `${num(row.fat_dm)}%`)}
        ${kv("탄수화물(DM)", `${num(row.carb_dm)}%`)}
        <div class="sep"></div>
        <p class="small">다음 단계: add 저장 시점에 칼로리/g/Mcal/문구까지 미리 계산해 DB에 같이 저장하면 비용이 줄어요.</p>
      </section>

      <section class="card" style="display:flex;flex-direction:column;gap:10px">
        <h2 class="h2">원료 리스트</h2>
        <p class="p">${escapeHtml(ingredients.join(", ") || "—")}</p>
        <div class="sep"></div>
        <div class="notice">
          <strong>안내</strong>
          <div class="sep"></div>
          <div class="small">키블핏은 사료가 좋다/나쁘다를 단정하기보다 비교·이해를 돕는 참고용 가이드로 설계하는 것을 권장합니다.</div>
        </div>
      </section>
    </section>

    ${footer()}
  </main>

  <script src="/assets/js/nav.js" defer></script>
</body>
</html>`;

  const res = new Response(html, {
  headers: {
    "content-type": "text/html; charset=utf-8",
    // ✅ Edge 캐시용(Cloudflare) 힌트 + 브라우저 캐시
    // - s-maxage: CDN/프록시(엣지) 캐시 TTL
    // - stale-while-revalidate: 만료 후에도 잠깐은 빠르게 응답하면서 백그라운드 갱신 가능(실서비스 체감 개선)
    "cache-control": "public, max-age=60, s-maxage=1800, stale-while-revalidate=86400"
  }
});

// ✅ 캐시 MISS → HTML을 엣지 캐시에 저장
res.headers.set("x-kib-cache", "MISS");
// put()은 body를 소비하므로 clone해서 저장
await cache.put(htmlCacheKey, res.clone());

// ✅ meta(버전)도 함께 저장 (업데이트 시 즉시 무효화를 위해)
const v = String(row.updated_at || "").trim() || new Date().toISOString();
await cache.put(
  metaKey,
  new Response(v, { headers: { "cache-control": "public, max-age=0, s-maxage=86400" } })
);

return res;
}

function getOgImageUrl(request){
  const origin = new URL(request.url).origin;
  // ✅ 여기에 기본 OG 이미지를 둬주세요:
  // public/assets/images/og-default.png (1200x630 권장)
  return `${origin}/assets/images/og-default.png`;
}

function safeJson(s, fallback){ try { return JSON.parse(s); } catch { return fallback; } }
function num(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }

function kv(k, v){
  return `<div class="row" style="justify-content:space-between">
    <div class="small" style="font-weight:900">${escapeHtml(k)}</div>
    <div style="font-weight:1000">${escapeHtml(v)}</div>
  </div>`;
}

function sprite(){
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
    <symbol id="ico-paw" viewBox="0 0 24 24">
      <path d="M12 14c-2.6 0-4.8 2.2-4.8 4.6 0 1.3 1.1 2.4 2.5 2.4h4.6c1.4 0 2.5-1.1 2.5-2.4C16.8 16.2 14.6 14 12 14z"/>
      <path d="M7 10.5c.9 0 1.6-.9 1.6-2s-.7-2-1.6-2-1.6.9-1.6 2 .7 2 1.6 2zm10 0c.9 0 1.6-.9 1.6-2s-.7-2-1.6-2-1.6.9-1.6 2 .7 2 1.6 2zM9.2 6.8c.8 0 1.4-.8 1.4-1.8S10 3.2 9.2 3.2 7.8 4 7.8 5s.6 1.8 1.4 1.8zm5.6 0c.8 0 1.4-.8 1.4-1.8s-.6-1.8-1.4-1.8-1.4.8-1.4 1.8.6 1.8 1.4 1.8z"/>
    </symbol>
  </svg>`;
}

function topbar(){
  return `<header class="topbar">
    <div class="topbar__inner">
      <a class="brand" href="/">
        <span class="brand__mark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24"><use href="#ico-paw"></use></svg>
        </span>
        <span>키블핏</span>
      </a>
      <nav class="nav" aria-label="주요 메뉴">
        <a href="/" data-path="/">홈</a>
        <a href="/foods/" data-path="/foods">사료 목록</a>
        <a href="/tools/" data-path="/tools">도구</a>
        <a href="/about/" data-path="/about">소개</a>
        <a href="/add.html" data-path="/add.html">등록</a>
      </nav>
    </div>
  </header>`;
}

function footer(){
  return `<footer class="footer container">
    <div class="footer__inner">
      <div>© 2026 키블핏</div>
      <div>제조사 라벨 기반으로 정보를 정리하는 참고용 가이드입니다.</div>
    </div>
  </footer>`;
}

function renderNotFound(slug, request){
  const canonical = new URL(request.url);
  canonical.pathname = `/food/${encodeURIComponent(slug)}`;
  canonical.search = "";
  canonical.hash = "";

  return `<!doctype html><html lang="ko"><head>
    <meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>사료를 찾을 수 없어요 | 키블핏</title>
    <meta name="robots" content="noindex,nofollow" />
    <link rel="canonical" href="${escapeHtml(canonical.toString())}" />
    <link rel="stylesheet" href="/assets/css/app.css" />
    <link rel="stylesheet" href="/assets/css/components.css" />
  </head><body>${sprite()}${topbar()}
    <main class="container">
      <section class="card" style="display:flex;flex-direction:column;gap:10px">
        <h1 class="h1">사료를 찾을 수 없어요</h1>
        <p class="p">요청한 slug: <b>${escapeHtml(slug)}</b></p>
        <div class="row">
          <a class="btn btn--brand" href="/add.html">사료 등록하기</a>
          <a class="btn" href="/foods/">목록</a>
        </div>
      </section>
    </main>
    <script src="/assets/js/nav.js" defer></script>
  </body></html>`;
}
