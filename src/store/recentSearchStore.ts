import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Platform } from "@/lib/constants";

// 최근 검색 1건 — 닉네임+플랫폼으로 식별, 검색 시각은 Date.now() 타임스탬프.
export interface RecentSearch {
  name: string;
  platform: Platform;
  searchedAt: number;
}

// 저장·노출 최대 개수
const MAX_RECENT = 5;

interface RecentSearchState {
  items: RecentSearch[];
  // 검색 기록 추가 — 동일 name+platform은 중복 없이 최상단으로 갱신, 최대 5개 유지
  add: (name: string, platform: Platform) => void;
  // 개별 삭제
  remove: (name: string, platform: Platform) => void;
  // 전체 초기화
  clear: () => void;
}

function isSame(item: RecentSearch, name: string, platform: Platform): boolean {
  // PUBG 닉네임은 대소문자를 구분하므로 정확 일치로 비교
  return item.name === name && item.platform === platform;
}

export const useRecentSearchStore = create<RecentSearchState>()(
  persist(
    (set) => ({
      items: [],
      add: (name, platform) =>
        set((state) => {
          const rest = state.items.filter((item) => !isSame(item, name, platform));
          const next: RecentSearch = { name, platform, searchedAt: Date.now() };
          return { items: [next, ...rest].slice(0, MAX_RECENT) };
        }),
      remove: (name, platform) =>
        set((state) => ({
          items: state.items.filter((item) => !isSame(item, name, platform)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "redzon-recent-searches" },
  ),
);
