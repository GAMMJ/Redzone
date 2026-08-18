import type { ReactNode } from "react";
import Avatar from "@/components/ui/Avatar";
import StatBar from "@/components/ui/StatBar";
import TierLabel from "@/components/ui/TierLabel";
import type { LeaderboardEntry } from "@/types/leaderboard";

// 바를 가득 채우는 기준값 — 목록 최대값이 아니라 고정값이라야 플랫폼·시즌이 바뀌어도
// 같은 수치가 같은 길이로 보인다. 초과분은 StatBar가 clamp.
const AVERAGE_DAMAGE_FULL = 1000;
const AVERAGE_KILL_FULL = 10;
const WIN_RATE_FULL = 100;

// 컬럼 사이 간격 — 헤더·행·스켈레톤이 같은 값을 써야 열이 어긋나지 않는다.
export const RANKING_ROW_GAP = "gap-x-1";

export interface RankingColumn {
  key: string;
  label: string;
  // 헤더·데이터 행·스켈레톤이 공유하는 셀 폭·정렬 클래스
  cellClassName: string;
  render: (entry: LeaderboardEntry) => ReactNode;
  // 스켈레톤 행의 자리표시자 — 실제 값과 같은 파일에서 관리해 로딩→실제 전환 시 열이 튀지 않게 한다
  placeholder: ReactNode;
}

// 스켈레톤 자리표시자 공통 막대
function PulseBar({ className }: { className: string }) {
  return <span className={`block h-4 animate-pulse rounded bg-hairline ${className}`} />;
}

// 랭킹 테이블 컬럼 정의(표시 순서대로) — 컬럼을 추가·삭제·변경할 때 이 배열만 고치면
// 헤더·데이터 행·스켈레톤 세 곳에 한 번에 반영된다.
// 플레이어 열만 남는 폭을 차지하고(flex-1) 값이 왼쪽 정렬, 나머지 지표 열은 고정 폭 중앙 정렬이다.
export const RANKING_COLUMNS: RankingColumn[] = [
  {
    key: "rank",
    label: "순위",
    cellClassName: "w-16 shrink-0 text-center",
    render: (entry) => (
      <span className="font-mono text-sm font-medium text-text-tertiary">{entry.rank}</span>
    ),
    placeholder: <PulseBar className="mx-auto w-5" />,
  },
  {
    key: "name",
    label: "플레이어",
    cellClassName: "min-w-0 flex-1 text-center",
    render: (entry) => (
      <span className="flex min-w-0 items-center gap-3">
        <Avatar alt={entry.name} />
        <span className="truncate text-sm font-semibold text-text-primary">{entry.name}</span>
      </span>
    ),
    placeholder: (
      <span className="flex items-center gap-3">
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-hairline" />
        <PulseBar className="w-32" />
      </span>
    ),
  },
  {
    key: "tier",
    label: "티어",
    cellClassName: "w-36 shrink-0 text-center",
    render: (entry) => (
      <TierLabel
        tier={entry.tier}
        subTier={entry.subTier}
        className="text-caption text-text-secondary"
      />
    ),
    placeholder: <PulseBar className="mx-auto w-20" />,
  },
  {
    key: "rankPoints",
    label: "레이팅",
    cellClassName: "w-28 shrink-0 text-center",
    render: (entry) => (
      <span className="font-mono text-sm font-bold text-primary">
        {entry.rankPoints.toLocaleString()}
      </span>
    ),
    placeholder: <PulseBar className="mx-auto w-12" />,
  },
  {
    key: "averageDamage",
    // 평균 딜량·평균 킬·승률은 값 옆에 채움 바가 붙어 다른 지표 열보다 넓다.
    label: "평균 딜량",
    cellClassName: "w-40 shrink-0 text-center",
    render: (entry) => (
      <StatBar
        value={entry.averageDamage}
        max={AVERAGE_DAMAGE_FULL}
        formatValue={(value) => value.toLocaleString()}
        ariaLabel="평균 딜량"
        fillClassName="bg-danger"
      />
    ),
    placeholder: <PulseBar className="mx-auto w-24" />,
  },
  {
    key: "averageKill",
    label: "평균 킬",
    cellClassName: "w-40 shrink-0 text-center",
    render: (entry) => (
      <StatBar
        value={entry.averageKill}
        max={AVERAGE_KILL_FULL}
        formatValue={(value) => value.toFixed(2)}
        ariaLabel="매치당 평균 킬"
        fillClassName="bg-success"
      />
    ),
    placeholder: <PulseBar className="mx-auto w-24" />,
  },
  {
    key: "games",
    label: "판수",
    cellClassName: "w-24 shrink-0 text-center",
    render: (entry) => (
      <span className="font-mono text-sm text-text-secondary">
        {entry.games.toLocaleString()}
      </span>
    ),
    placeholder: <PulseBar className="mx-auto w-8" />,
  },
  {
    key: "winRate",
    label: "승률",
    cellClassName: "w-40 shrink-0 text-center",
    // winRatio(0~1 소수)를 퍼센트로 환산해 넘긴다 — 바 길이와 표시 숫자가 같은 값에서 나온다
    render: (entry) => (
      <StatBar
        value={entry.winRatio * WIN_RATE_FULL}
        max={WIN_RATE_FULL}
        formatValue={(value) => `${value.toFixed(1)}%`}
        ariaLabel="승률"
        fillClassName="bg-info"
      />
    ),
    placeholder: <PulseBar className="mx-auto w-24" />,
  },
];

// 컬럼 헤더 — 데이터 테이블과 스켈레톤이 같은 헤더를 쓰도록 컬럼 정의 옆에 둔다.
export function RankingTableHeader() {
  return (
    <div
      className={`flex items-center border-b border-hairline bg-primary-soft px-6 py-3 text-xs font-semibold tracking-[0.3px] text-primary ${RANKING_ROW_GAP}`}
    >
      {RANKING_COLUMNS.map((column) => (
        <span key={column.key} className={column.cellClassName}>
          {column.label}
        </span>
      ))}
    </div>
  );
}
