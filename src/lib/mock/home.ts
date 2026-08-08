// 메인페이지 UI용 임시 목업 — 실데이터(리더보드·트렌딩·뉴스) 연동 전 정적 표시용.
// 실데이터 붙일 때 이 파일만 서버 함수/훅으로 교체하면 된다(교체 지점 단일화).

export interface LiveRankingEntry {
  rank: number;
  name: string;
  tier: string;
  subTier: string;
  rankPoints: number;
}

// 실시간 랭킹(스쿼드 TPP) 상위 — 목업
export const LIVE_RANKING: LiveRankingEntry[] = [
  { rank: 1, name: "택이", tier: "Master", subTier: "0", rankPoints: 5840 },
  { rank: 2, name: "AWKN_Deft", tier: "Master", subTier: "0", rankPoints: 5610 },
  { rank: 3, name: "GOlden_Pochinki", tier: "Diamond", subTier: "1", rankPoints: 5330 },
  { rank: 4, name: "SnaccMachine", tier: "Diamond", subTier: "2", rankPoints: 5120 },
  { rank: 5, name: "RecoilQueen", tier: "Diamond", subTier: "3", rankPoints: 4980 },
  { rank: 6, name: "MiramarMagician", tier: "Platinum", subTier: "1", rankPoints: 4790 },
  { rank: 7, name: "제르바", tier: "Platinum", subTier: "2", rankPoints: 4620 },
  { rank: 8, name: "ClutchOrKick", tier: "Platinum", subTier: "3", rankPoints: 4510 },
];

export interface TrendingEntry {
  rank: number;
  name: string;
  // 순위 변동 폭 — 양수 상승, 음수 하락 (목업; 실제 집계엔 변동값 별도)
  delta: number;
}

// 지금 뜨는 플레이어(검색량 급상승) — 목업
export const TRENDING_PLAYERS: TrendingEntry[] = [
  { rank: 1, name: "AWKN_Deft", delta: 12 },
  { rank: 2, name: "GOlden_Pochinki", delta: 8 },
  { rank: 3, name: "SnaccMachine", delta: -3 },
  { rank: 4, name: "RecoilQueen", delta: 5 },
  { rank: 5, name: "MiramarMagician", delta: 2 },
];

export interface NewsItem {
  category: string;
  date: string;
  title: string;
}

// 최신 PUBG 뉴스 — 목업
export const NEWS_ITEMS: NewsItem[] = [
  {
    category: "패치 노트",
    date: "2026.07.02",
    title: "업데이트 32.1: Beryl M762 밸런스 조정과 비켄디 파밍 개편",
  },
  {
    category: "e스포츠",
    date: "2026.06.28",
    title: "PUBG 글로벌 챔피언십 결승 진출 지역 예선 일정 공개",
  },
  {
    category: "시즌",
    date: "2026.06.20",
    title: "시즌 24와 함께 새로운 랭크 보상과 개편된 티어 시스템 도입",
  },
];
