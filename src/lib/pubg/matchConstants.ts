// 매치 관련 설정값 — 서버(SSR·라우트)와 클라이언트가 같은 값을 써야 해서 한곳에 모은다.
// 데이터 모듈(records.ts)은 server-only라 클라가 import할 수 없고,
// 전역 constants.ts는 lucide 아이콘을 끌고 와서 숫자 하나 때문에 참조하기엔 무겁다.

// 최근 매치 한 페이지에 보여줄 매치 수.
// 서버가 첫 페이지를 미리 그리고 클라가 이후 페이지를 받아오므로 양쪽이 어긋나면 안 된다.
// 페이지당 PUBG 호출 수이기도 해서 늘리면 첫 방문 429 위험이 커진다.
export const RECENT_MATCHES_PAGE_SIZE = 10;

// 목록 카드용 요약 캐시(약 200바이트). 종료된 매치는 불변이라 길게 잡는다.
export const MATCH_SUMMARY_TTL = 60 * 60 * 24 * 30;

// 상세용 원본 캐시(약 63KB). 카드를 펼쳐 보는 동안만 필요하므로 짧게 잡는다.
// PUBG 문서상 /matches 는 rate limit 대상이 아니라, 만료 후 다시 불러도 한도를 쓰지 않는다.
// (실측으로도 확인: 매치 호출은 X-Ratelimit-Remaining 을 줄이지 않는다)
export const MATCH_DETAIL_TTL = 60 * 60;

// 요약 캐시 스키마 버전.
// transform 결과를 그대로 저장하므로 MatchSummary 필드를 바꾸면
// 옛 모양이 TTL 내내 그대로 나간다. 모양을 바꿀 때마다 이 값을 올려 캐시를 무효화할 것.
export const MATCH_SUMMARY_SCHEMA_VERSION = "v1";

// 텔레메트리 요약 캐시. 매치는 불변이라 한 번 만들면 다시 만들 이유가 없다.
export const TELEMETRY_TTL = 60 * 60 * 24 * 30;

// 텔레메트리 요약 스키마 버전.
// MatchTelemetry 모양을 바꾸면 옛 요약이 TTL 내내 그대로 나간다. 바꿀 때마다 올릴 것.
export const TELEMETRY_SCHEMA_VERSION = "v8";

// 텔레메트리는 30MB가 넘어 받고 파싱하는 데 시간이 걸린다(실측 약 420ms).
// 기본 8초로는 빠듯할 수 있어 따로 넉넉히 잡는다.
export const TELEMETRY_TIMEOUT = 20000;

// 배치 요약은 매치를 한꺼번에 여러 건 연다. 한 건이 매달리면 나머지가 다 와도 끝나지 않으므로
// 기본값보다 짧게 조여 느린 건만 버리고 나머지로 화면을 그린다.
export const MATCH_BATCH_TIMEOUT = 5000;

// 한 번에 요약할 최대 매치 수 — 요청당 PUBG 호출이 그만큼 늘어난다.
// 라우트는 인증이 없어서 아무나 호출할 수 있고, 캐시에 없는 id는 전부 PUBG로 나간다.
// 실제 호출부(SSR·클라)가 모두 한 페이지 분량만 보내므로 상한도 거기에 맞춘다.
export const MAX_SUMMARY_IDS = RECENT_MATCHES_PAGE_SIZE;
