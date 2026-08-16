// PUBG 리더보드 정제 항목 — 홈 실시간 랭킹 카드용 상위 요약.
// (원본 raw는 data=랭크순 참조 + included=실제 player 객체로 분리돼 있어, 서버에서 조인·정제해 이 형태로 만든다.)
export interface LeaderboardEntry {
  rank: number;
  name: string;
  tier: string;
  subTier: string;
  rankPoints: number;
}
