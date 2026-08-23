// 매치 ID 형식 검사 — 라우트와 요약 배치가 함께 쓴다.
// PUBG 매치 ID는 UUID지만, 여기서 중요한 건 "/"나 "."가 섞여 PUBG 경로를 벗어나지 못하게 막는 것이다.
const MATCH_ID_PATTERN = /^[0-9a-zA-Z-]{8,64}$/;

export function isValidMatchId(value: unknown): value is string {
  return typeof value === "string" && MATCH_ID_PATTERN.test(value);
}
