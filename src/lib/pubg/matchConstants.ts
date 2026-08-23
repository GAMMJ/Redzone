// 매치 관련 설정값 — 서버(SSR·라우트)와 클라이언트가 같은 값을 써야 해서 한곳에 모은다.
// 데이터 모듈(records.ts)은 server-only라 클라가 import할 수 없고,
// 전역 constants.ts는 lucide 아이콘을 끌고 와서 숫자 하나 때문에 참조하기엔 무겁다.

// 최근 매치 한 페이지에 보여줄 매치 수.
// 서버가 첫 페이지를 미리 그리고 클라가 이후 페이지를 받아오므로 양쪽이 어긋나면 안 된다.
// 페이지당 PUBG 호출 수이기도 해서 늘리면 첫 방문 429 위험이 커진다.
export const RECENT_MATCHES_PAGE_SIZE = 10;

// 종료된 매치는 다시 바뀌지 않는다 → 30일 캐시.
// 목록 요약과 상세가 같은 캐시 키(`pubg:{shard}:matches/{id}:`)를 쓰므로,
// 목록을 한 번 그리면 카드를 펼칠 때는 PUBG를 다시 호출하지 않는다.
export const MATCH_CACHE_TTL = 60 * 60 * 24 * 30;

// 배치 요약은 매치를 한꺼번에 여러 건 연다. 한 건이 매달리면 나머지가 다 와도 끝나지 않으므로
// 기본값보다 짧게 조여 느린 건만 버리고 나머지로 화면을 그린다.
export const MATCH_BATCH_TIMEOUT = 5000;

// 한 번에 요약할 최대 매치 수 — 요청당 PUBG 호출이 그만큼 늘어난다.
// 라우트는 인증이 없어서 아무나 호출할 수 있고, 캐시에 없는 id는 전부 PUBG로 나간다.
// 실제 호출부(SSR·클라)가 모두 한 페이지 분량만 보내므로 상한도 거기에 맞춘다.
export const MAX_SUMMARY_IDS = RECENT_MATCHES_PAGE_SIZE;
