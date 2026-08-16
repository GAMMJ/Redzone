// 실시간 랭킹 테이블의 고정 컬럼 폭 — LiveRanking(헤더·행)과 LiveRankingSkeleton이 공유해
// 정렬 어긋남을 방지한다. 닉네임 열은 flex-1이라 여기서 관리하지 않음.
export const LEADERBOARD_COL = {
  rank: "w-16 shrink-0",
  tier: "w-32 shrink-0",
  rp: "w-[70px] shrink-0",
} as const;
