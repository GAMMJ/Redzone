import type { ReactNode } from "react";

export interface StatItem {
  label: string;
  value: string | number;
}

// 카드 상단 요약(승/탑/패)
export interface ModeSummary {
  wins: number;
  top: number;
  losses: number;
}

interface ModeStatCardProps {
  label: string;
  // 상단: 승/탑/패 요약 (데이터 있을 때만)
  summary?: ModeSummary;
  // 중앙: 티어/RP 등 (경쟁전만). 없으면 이 구역 생략.
  middle?: ReactNode;
  // 하단: 스탯 8칸. 없으면 "기록 없음"을 중앙 구역에만 표시.
  stats?: StatItem[];
  emptyText?: string;
  // 모드별 상단 색 띠 (솔로/듀오/스쿼드 구분용)
  accentClass?: string;
}

function SummaryLine({ summary }: { summary: ModeSummary }) {
  return (
    <div className="whitespace-nowrap text-caption text-text-secondary">
      {summary.wins}승 {summary.top}탑 {summary.losses}패
    </div>
  );
}

export default function ModeStatCard({
  label,
  summary,
  middle,
  stats,
  emptyText = "기록이 없습니다",
  accentClass = "",
}: ModeStatCardProps) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-6 shadow-xs ${accentClass}`}
    >
      {/* 상단 — 모드명 + 승/탑/패 (한 줄) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
        <h4 className="text-lg font-bold text-text-primary">{label}</h4>
        {summary ? <SummaryLine summary={summary} /> : null}
      </div>

      {/* 중앙 — 티어/RP, 또는 기록 없음 (한 곳에만). 티어 아래에도 구분선. */}
      {!stats ? (
        <p className="py-4 text-center text-caption text-text-tertiary">{emptyText}</p>
      ) : middle ? (
        <div className="border-b border-hairline pb-4">{middle}</div>
      ) : null}

      {/* 하단 — 스탯 8칸 */}
      {stats ? (
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline justify-between gap-2">
              <span className="text-caption text-text-tertiary">{stat.label}</span>
              <span className="font-mono text-sm font-bold text-text-primary">{stat.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
