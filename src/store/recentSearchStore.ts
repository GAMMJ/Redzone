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
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUsable(value: unknown): value is RecentSearch {
  if (!isRecord(value)) return false;
  const { name, platform, searchedAt } = value;
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
      /**
       * 저장된 값을 그대로 믿지 않는다. 지원 플랫폼이 바뀌면 남의 브라우저에 있는 옛 항목이
       * 지금은 없는 플랫폼을 가리키게 된다.
       *
       * `migrate`가 아니라 `merge`인 이유는, 이게 "판이 바뀔 때 한 번" 하는 일이 아니라
       * **되살릴 때마다 하는 검사**여서다. 판 번호를 안 올린 변경에도 걸려야 한다.
       *
       * 걸러진 결과가 저장소에 곧바로 다시 써지지는 않는다(zustand는 migrate가 돌았을 때만
       * 다시 쓴다). 죽은 항목은 사용자가 다음에 검색·삭제할 때 함께 정리된다. 그동안에도
       * 화면은 매번 걸러진 것을 보므로 보이지도 해롭지도 않다.
       *
       * 기본 얕은 병합을 대신하므로 **여기 적은 필드만 살아남는다.** persist할 값이
       * 늘어나면 이 함수도 같이 고칠 것 — 안 그러면 조용히 버려진다.
       */
      merge: (persisted, current) => {
        const items = isRecord(persisted) ? persisted.items : undefined;
        return {
          ...current,
          items: Array.isArray(items) ? items.filter(isUsable) : [],
        };
      },
    },
  ),
);
