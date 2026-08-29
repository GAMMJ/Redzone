import Link from "next/link";

// 통계 페이지의 탭. 주소(`?tab=`)에 담는다.
//
// 카드 펼침을 주소에서 뺐던 것과는 성격이 다르다. 저건 목록 안의 일시적인 상태였고
// 이건 "어느 화면을 보고 있는가"라, 공유하면 그 화면이 열리고 새로고침해도 남아야 한다.
//
// 그래서 버튼이 아니라 링크다 — 가운데 클릭으로 새 탭에 열 수 있고, 자바스크립트가 아직
// 안 붙었어도 동작한다.

export const STATS_TABS = [
  { value: "personal", label: "개인 통계" },
  { value: "online", label: "동접자" },
] as const;

export type StatsTab = (typeof STATS_TABS)[number]["value"];

/** 주소에서 읽은 탭 값을 쓸 수 있는 것으로 정리한다. 모르는 값은 첫 탭. */
export function parseTab(raw: string | undefined): StatsTab {
  return STATS_TABS.some((t) => t.value === raw) ? (raw as StatsTab) : "personal";
}

interface StatsTabsProps {
  current: StatsTab;
  /** 탭을 바꿔도 검색한 사람은 유지한다 */
  hrefFor: (tab: StatsTab) => string;
}

export default function StatsTabs({ current, hrefFor }: StatsTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-md bg-surface-subtle p-1">
      {STATS_TABS.map((tab) => (
        <Link
          key={tab.value}
          href={hrefFor(tab.value)}
          // role="tab"을 쓰면 화살표 키 이동까지 갖춰야 한다(APG). 링크 둘뿐이라
          // 현재 위치만 aria-current로 알린다.
          aria-current={current === tab.value ? "page" : undefined}
          className={`flex-1 rounded-sm py-2 text-center text-sm font-semibold transition-colors ${
            current === tab.value
              ? "bg-surface text-text-primary shadow-xs"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
