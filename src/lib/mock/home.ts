// 메인페이지 UI용 임시 목업 — 뉴스는 외부 피드 확보 전 정적 표시용.
// (실시간 랭킹·시즌은 records.ts 실데이터로 교체됨) 실데이터 붙일 때 이 파일만 교체하면 된다.

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
