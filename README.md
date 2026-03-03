# 키블핏 Cloudflare Pages + Functions(SSR) 스타터 (v1)

이 스타터는 “정적 페이지 + 사료 상세만 SSR” 구조를 가장 단순하게 시작하도록 만든 뼈대예요.

## ✅ 목표 구조
- 대부분 페이지: `public/` 아래 정적 HTML로 배포 (SEO 강함)
- 사료 상세 페이지: `/food/:slug` 요청 시 **Cloudflare Pages Functions**가 DB에서 읽고 **HTML을 즉시 생성(SSR)** 해서 내려줌 (SEO 강함)
- 관리자 입력: `public/add.html`에서 저장 → DB에 반영 → 바로 `/food/:slug`에서 확인

## 폴더 구조
```
kibbblefit_cf_starter_v1/
├─ public/                 # 정적 배포 루트
│  ├─ index.html
│  ├─ foods/index.html
│  ├─ tools/index.html
│  ├─ about/index.html
│  ├─ add.html            # 관리자 입력(샘플)
│  ├─ assets/
│  │  ├─ css/
│  │  └─ js/
│  └─ 404.html
├─ functions/              # Pages Functions (SSR)
│  ├─ food/[slug].js       # /food/:slug SSR
│  ├─ api/foods.js         # /api/foods (GET/POST)
│  └─ sitemap.xml.js       # /sitemap.xml 동적 생성
└─ db/
   ├─ schema.sql
   └─ seed.sql
```

## 1) 로컬 개발
```bash
npm i
wrangler d1 create kibbblefit-db
```
생성 결과로 나온 `database_id`를 `wrangler.toml`에 넣어주세요.

스키마/시드 적용:
```bash
npm run d1:exec
npm run d1:seed
```

실행:
```bash
npm run dev
```

- 홈: http://localhost:8788/
- 등록: http://localhost:8788/add.html
- 상세(SSR): http://localhost:8788/food/wellness-core-original
- 사이트맵(동적): http://localhost:8788/sitemap.xml

## 2) 배포(Cloudflare Pages)
- Pages 프로젝트 생성 후 GitHub 연결(추천) 또는 업로드로 배포
- Functions 폴더는 Pages에서 자동 인식
- D1을 쓰면 Pages 프로젝트 설정에서 D1 바인딩(KIB_D1) 연결이 필요

## 3) 다음 단계 추천(비용 절감)
- add 저장 시점에 DM/칼로리/g/Mcal/문구를 미리 계산해 DB에 같이 저장 (SSR CPU↓)
- /food/:slug 응답을 캐시(짧게) 적용
- add.html은 noindex 유지 + 간단 보호(비밀번호) 추가
