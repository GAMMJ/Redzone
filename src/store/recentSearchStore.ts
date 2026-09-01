import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isPlatform, type Platform } from "@/lib/constants";

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

/**
 * 브라우저에 남아 있던 기록이 지금도 쓸 수 있는 모양인가.
 *
 * 이 저장소는 사용자 기기에 남는다. 우리가 지원 플랫폼을 바꿔도 남의 브라우저에 있는
 * 옛 값은 그대로다 — `console`을 뺐을 때 실제로 그랬다. 그 항목은 플랫폼 라벨이 빈 채로
 * 그려지고, 눌러 들어가면 이제 없는 경로로 간다. 되살릴 때 걸러 낸다.
 */
function isUsable(value: unknown): value is RecentSearch {
  if (typeof value !== "object" || value === null) return false;
  const { name, platform, searchedAt } = value as Record<string, unknown>;
  if (typeof name !== "string" || name.length === 0) return false;
  if (typeof searchedAt !== "number") return false;
  return typeof platform === "string" && isPlatform(platform);
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
    {
      name: "redzon-recent-searches",
      // 저장된 값을 그대로 믿지 않는다. 지원 플랫폼이 바뀌면 남의 브라우저에 있는 옛 항목이
      // 지금은 없는 플랫폼을 가리키게 된다.
      merge: (persisted, current) => {
        const items = (persisted as { items?: unknown })?.items;
        return {
          ...current,
          items: Array.isArray(items) ? items.filter(isUsable) : [],
        };
      },
    },
  ),
);
