// PUBG 리더보드 정제 항목 — 홈 실시간 랭킹 카드·랭킹 페이지용 상위 요약.
// (원본 raw는 data=랭크순 참조 + included=실제 player 객체로 분리돼 있어, 서버에서 조인·정제해 이 형태로 만든다.)
export interface LeaderboardEntry {
  rank: number;
  name: string;
  tier: string;
  subTier: string;
  rankPoints: number;
  // 랭킹 페이지 표시용 스탯. 리더보드 stats에 없으면 0.
  // 리더보드엔 deaths가 없어 K/D를 만들 수 없다(판수-승은 승수가 많을수록 크게 어긋남).
  // → 대신 API가 그대로 주는 averageKill(매치당 평균 킬)을 쓴다.
  games: number;
  averageDamage: number;
  averageKill: number;
  winRatio: number; // 0~1 소수 (stats.winRatio)
}
