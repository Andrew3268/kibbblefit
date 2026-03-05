import { escapeHtml, jsonld, okHtml, edgeCache } from "../_utils.js";
import { calculateNutrition } from "../../lib/nutrition/nutritionCalc.js";

export async function onRequestGet({ params, env, request }){
  // const slug = String(params.slug || "");
  const slug = decodeURIComponent(String(params.slug || ""));
  if (!slug) return okHtml("Not Found", { status: 404 });

  // 1) 최소 조회: updated_at만 가져와 캐시 키로 사용 (콘솔에서 직접 UPDATE해도 updated_at 바꾸면 자동 갱신)
  const meta = await env.KIB_D1
    .prepare("SELECT updated_at FROM foods WHERE slug = ?")
    .bind(slug)
    .first();

  if (!meta){
    return okHtml(renderNotFound(slug, request), {
      status: 404,
      headers: { "cache-control": "no-store" }
    });
  }

  const updatedAt = String(meta.updated_at || "");
  const url = new URL(request.url);
  const cacheKeyUrl = `${url.origin}/food/${encodeURIComponent(slug)}?v=${encodeURIComponent(updatedAt)}`;

  return edgeCache({
    request,
    cacheKeyUrl,
    ttlSeconds: 300,
    buildResponse: async () => {
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

      if (!row){
        return okHtml(renderNotFound(slug, request), { status: 404, headers: { "cache-control": "no-store" } });
      }

      const ingredients = safeJson(row.ingredients_json, []);

      //DM 및 추정 탄수화물 영양 계산 실행
      const nutrition = calculateNutrition({
        protein: row.crude_protein,
        fat: row.crude_fat,
        fiber: row.crude_fiber,
        ash: row.ash,
        moisture: row.moisture,
        calcium: row.calcium,
        phosphorus: row.phosphorus
      });

      const title = `${row.name} 분석 | 키블핏`;
      const desc  = `${row.name}의 보증성분(라벨)과 원료 구성을 한눈에 정리했어요.`;

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

  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <link rel="canonical" href="${escapeHtml(canonical.toString())}" />

  <meta name="robots" content="index,follow" />
  <meta name="theme-color" content="#5B7CFF" />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="키블핏" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:url" content="${escapeHtml(canonical.toString())}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

  <link rel="stylesheet" href="/assets/css/app.css" />
  <link rel="stylesheet" href="/assets/css/components.css" />

  ${jsonld({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${row.name} 사료 분석`,
    "description": desc,
    "mainEntityOfPage": canonical.toString(),
    "dateModified": row.updated_at,
    "datePublished": row.updated_at,
    "author": { "@type": "Organization", "name": "키블핏" },
    "publisher": { "@type": "Organization", "name": "키블핏", "logo": { "@type": "ImageObject", "url": ogImage } },
    "image": [ogImage]
  })}
</head>

<body>
  ${sprite()}
  ${topbar()}

  <main class="container">
    <section class="card" style="display:flex;flex-direction:column;gap:10px">
      <div class="row" style="flex-wrap:wrap">
        <span class="badge">SSR</span>
        <span class="badge">${escapeHtml(row.brand || "브랜드")}</span>
        ${row.life_stage ? `<span class="badge">급여연령 ${escapeHtml(row.life_stage)}</span>` : ``}
        <span class="badge">업데이트 ${escapeHtml(String(row.updated_at||"").slice(0,10) || "")}</span>
      </div>

      <h1 class="h1">${escapeHtml(row.name)}</h1>
      <p class="p">이 페이지는 DB에서 읽어 <b>HTML을 생성(SSR)</b>하고, 엣지에 캐시됩니다. (Response Headers에서 <b>x-kib-cache</b> 확인)</p>

      <div class="row" style="gap:8px;flex-wrap:wrap">
        <a class="btn" href="/edit.html?slug=${encodeURIComponent(slug)}">이 사료 수정하기</a>
        <a class="btn" href="/foods/">목록으로</a>
      </div>
    </section>

    <section class="grid grid--2" style="margin-top:14px">
      <section class="card" style="display:flex;flex-direction:column;gap:10px">
        <h2 class="h2">보증성분(라벨 %)</h2>
        ${kv("조단백질", pct(row.crude_protein))}
        ${kv("조지방", pct(row.crude_fat))}
        ${kv("칼슘", pct(row.calcium))}
        ${kv("인", pct(row.phosphorus))}
        ${kv("조회분", pct(row.ash))}
        ${kv("조섬유", pct(row.crude_fiber))}
        ${kv("수분", pct(row.moisture))}
        <div class="sep"></div>
        <p class="small">* 라벨 표기 기준(As-fed %)입니다. (DM 변환/칼로리 계산은 다음 단계에서 추가 가능)</p>

        <div class="sep"></div>

        <h2 class="h2">Dry Matter 기준 영양</h2>
        ${kv("단백질 (DM)", formatPct(nutrition.dm.protein))}
        ${kv("지방 (DM)", formatPct(nutrition.dm.fat))}
        ${kv("탄수화물 추정 (DM)", formatPct(nutrition.dm.carbs))}
        ${kv("조섬유 (DM)", formatPct(nutrition.dm.fiber))}
        ${kv("조회분 (DM)", formatPct(nutrition.dm.ash))}
        ${kv("칼슘 (DM)", formatPct(nutrition.dm.calcium))}
        ${kv("인 (DM)", formatPct(nutrition.dm.phosphorus))}
      </section>

      <section class="card" style="display:flex;flex-direction:column;gap:10px">
        <h2 class="h2">원료 리스트</h2>
        <p class="p">${escapeHtml(ingredients.join(", ") || "—")}</p>
        <div class="sep"></div>
        <div class="notice">
          <strong>안내</strong>
          <div class="sep"></div>
          <div class="small">키블핏은 제조사 라벨 기반으로 정보를 정리하는 참고용 가이드입니다.</div>
        </div>
      </section>
    </section>

    ${footer()}
  </main>

  <script src="/assets/js/nav.js" defer></script>
</body>
</html>`;

      const res = okHtml(html, {
        headers: {
          "cache-control": "public, max-age=600"
        }
      });
      res.headers.set("x-kib-cache-version", updatedAt);
      return res;
    }
  });
}

function getOgImageUrl(request){
  const origin = new URL(request.url).origin;
  return `${origin}/assets/images/og-default.png`;
}

function safeJson(s, fallback){ try { return JSON.parse(s); } catch { return fallback; } }
function num(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }
function formatPct(v){
  const n = Number(v);
  if(!Number.isFinite(n)) return "—";
  return n.toFixed(1) + "%";
}

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
