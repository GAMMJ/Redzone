import { LEADERBOARD_COL as COL } from "./leaderboardColumns";

// LiveRanking 스트리밍 대기용 스켈레톤 — 카드 셸·컬럼 헤더는 그대로,
// 행만 pulse 플레이스홀더로 채워 레이아웃 이동(CLS) 없이 로딩을 표시.
const ROWS = Array.from({ length: 10 });

export default function LiveRankingSkeleton() {
  return (
    <div className="rounded-lg border border-hairline bg-surface shadow-xs">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="h-5 w-32 animate-pulse rounded bg-hairline" />
        <div className="h-4 w-16 animate-pulse rounded bg-hairline" />
      </div>

      <div className="flex items-center border-y border-hairline bg-primary-soft px-6 py-2.5 text-xs font-semibold tracking-[0.3px] text-primary">
        <span className={COL.rank}>순위</span>
        <span className="flex-1">닉네임</span>
        <span className={COL.tier}>티어</span>
        <span className={COL.rp}>RP</span>
      </div>

      <ul>
        {ROWS.map((_, index) => (
          <li key={index} className="border-b border-hairline last:border-b-0">
            <div className="flex items-center px-6 py-3">
              <span className={COL.rank}>
                <span className="block h-4 w-5 animate-pulse rounded bg-hairline" />
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-hairline" />
                <span className="h-4 w-28 animate-pulse rounded bg-hairline" />
              </div>
              <span className={COL.tier}>
                <span className="block h-4 w-20 animate-pulse rounded bg-hairline" />
              </span>
              <span className={COL.rp}>
                <span className="block h-4 w-12 animate-pulse rounded bg-hairline" />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
