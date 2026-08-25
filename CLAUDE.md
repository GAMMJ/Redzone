# 레드존 (RedZone Stats)

PUBG API 기반 배틀그라운드 전적 분석 플랫폼.

## 작업 부트스트랩 (docs/local 하네스)
`docs/local/`이 있으면, 작업 지시를 받는 즉시 **`docs/local/AI_ENTRYPOINT.md` 절차를 따른다** (이 문서 다음의 최우선 작업 절차). 요약:
- **변경 사이즈 판별**: 1~3파일 단순=`micro` / 4~10파일 단일 도메인=`normal` / 10+·공통 모듈=`cross`
- **normal·cross는 티켓 필수**: `docs/local/tickets/<ID>.md` (없으면 `_TEMPLATE.md`로 생성, 완료 후 `## 회고`까지 작성)
- **임시 메모·디버깅 흔적**: `docs/local/scratch/` 사용 (시스템 임시폴더 대신)
- **프로젝트 레퍼런스(SSOT)**: `docs/local/SSOT.md` — 스택·환경변수·주요 파일 경로
- 세션·일일 로그는 `.claude/hooks/`가 자동 기록 (수동 개입 불필요)

## 스택
Next.js (App Router) + React 19 + TypeScript · Tailwind CSS 4
Zustand · TanStack Query v5 (클라 인터랙션) · Recharts · dayjs · axios
Vercel (SSR + Route Handlers) · Upstash Redis

> **렌더링 원칙(SEO 핵심)**: SEO가 중요한 페이지(플레이어·랭킹)는 **서버 컴포넌트 fetch + `generateMetadata`** 로 SSR.
> 인터랙션 많은 부분만 `'use client'` + TanStack Query. 라우팅은 App Router 파일 구조(`next/navigation`).

## 패키지 매니저
**pnpm 전용** — npm/yarn 사용 금지
- 설치: `pnpm install` (npm install 금지)
- 패키지 추가: `pnpm add`, `pnpm add -D`
- `package-lock.json`, `yarn.lock` 생성 금지 → `pnpm-lock.yaml`만 커밋

## 절대 금지
- PUBG API 직접 호출 금지 → 반드시 `/api/pubg` 경유
- `any` 타입 금지 → 불명확하면 `unknown` + 타입 가드
- `.env` 커밋 금지
- 인라인 스타일(`style={{}}`) 금지 → Tailwind만 사용
- 클래스 컴포넌트 금지 → 함수형만
- `npm install`/`npm run` 등 npm 명령어 사용 금지 → `pnpm` 사용

## 성능 규칙 (앞으로 구현 시 준수)
- **이미지**: `next/image` **사용 금지** (Vercel 무료 이미지 최적화 한도) → 사전 압축한 webp/avif를 일반 `<img>`로 쓰고 `width`/`height` 지정해 CLS 방지
- **무거운 라이브러리(Recharts 등)**: 차트·무거운 컴포넌트는 `next/dynamic`(`dynamic(() => import(...))`)으로 코드 스플리팅
- **긴 목록(랭킹·매치 리스트)**: 가상화(`react-window`) 또는 `content-visibility: auto`로 렌더 비용 절감
- **서드파티 스크립트(애널리틱스·뉴스 위젯 등)**: `next/script`의 `strategy`(`afterInteractive`/`lazyOnload`)로 로드
- **SSR 데이터 패칭**: SEO 페이지(플레이어·랭킹)는 `fetch(url, { next: { revalidate: N } })`로 캐싱

## 브랜치
기능·수정사항마다 `dev`에서 브랜치 생성 (`/branch` 사용), `dev`/`main` 직접 커밋 금지

| type | 브랜치 prefix | 예시 (N=이슈 번호) |
|---|---|---|
| feat | `feature/` | `feature/5--player-search` |
| fix | `fix/` | `fix/2--api-rate-limit` |
| refactor | `refactor/` | `refactor/9--use-player-hook` |
| style | `style/` | `style/4--dark-theme` |
| docs | `docs/` | `docs/6--readme` |
| chore | `chore/` | `chore/3--eslint-config` |

형식: `{prefix}{N}--{kebab-case}` (N은 연결된 GitHub 이슈 번호)

## PR
**base 브랜치는 항상 `dev`** — `main`은 배포용 브랜치이므로 PR 대상에서 제외
(예외: `dev`→`main` 릴리즈 PR)

## 이슈 · PR 템플릿
- 이슈 생성: `.github/ISSUE_TEMPLATE/`의 `bug_report.yml`(버그) · `feature_request.yml`(기능) · `refactor.yml`(리팩토링) 사용
- PR 생성: `.github/PULL_REQUEST_TEMPLATE.md` 형식 준수 (관련 이슈 · 작업 내용 · 변경 사항 · 스크린샷 · 체크리스트)

## 커밋
`<type>(<scope>): 한글 제목` — type/scope는 영문 유지
type: feat · fix · refactor · style · docs · chore

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
