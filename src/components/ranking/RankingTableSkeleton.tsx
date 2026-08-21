import { RANKING_COLUMNS, RANKING_ROW_GAP, RankingTableHeader } from "./rankingColumns";

// RankingTable 스트리밍 대기용 스켈레톤 — 카드 셸·컬럼 헤더는 그대로,
// 행만 pulse 플레이스홀더로 채워 레이아웃 이동(CLS) 없이 로딩을 표시.
const ROWS = Array.from({ length: 20 });

export default function RankingTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs">
      <RankingTableHeader />

      <ul>
        {ROWS.map((_, index) => (
          <li key={index} className="border-b border-hairline last:border-b-0">
            <div className={`flex items-center px-6 py-3 ${RANKING_ROW_GAP}`}>
              {RANKING_COLUMNS.map((column) => (
                <span key={column.key} className={column.cellClassName}>
                  {column.placeholder}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
