import { RANKING_COLUMNS, RANKING_ROW_GAP, RankingTableHeader } from "./rankingColumns";

// RankingTable 스트리밍 대기용 스켈레톤 — 카드 셸·컬럼 헤더는 그대로,
// 행만 pulse 플레이스홀더로 채워 레이아웃 이동(CLS) 없이 로딩을 표시.
const ROWS = Array.from({ length: 20 });

export default function RankingTableSkeleton() {
  return (
    // 셸은 RankingTable과 같은 클래스여야 한다 — overflow-clip인 이유는 그쪽 주석 참고.
    // 다르면 로딩 중에는 헤더가 안 붙어 있다가 실제 표로 바뀌며 갑자기 붙는다.
    <div className="overflow-clip rounded-lg border border-hairline bg-surface shadow-xs">
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
