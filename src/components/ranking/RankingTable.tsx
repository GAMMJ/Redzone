import Link from "next/link";
import { playerPath } from "@/lib/paths";
import { getLeaderboard } from "@/lib/pubg/records";
import { RANKING_GAME_MODE, RANKING_LIMIT, type RankingPlatform } from "./rankingParams";
import { RANKING_COLUMNS, RANKING_ROW_GAP, RankingTableHeader } from "./rankingColumns";

interface RankingTableProps {
  platform: RankingPlatform;
  // 현재 시즌(id·번호). 없으면 조회 생략하고 안내 문구로 degrade.
  season: { id: string; number: number } | null;
}

// 경쟁전 상위 랭커 테이블(async 서버). season 없음/빈 결과는 안내 문구로 degrade.
export default async function RankingTable({ platform, season }: RankingTableProps) {
  const entries = season
    ? await getLeaderboard(platform, RANKING_GAME_MODE, season.id, RANKING_LIMIT)
    : [];

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-surface shadow-xs">
        <p className="px-6 py-16 text-center text-caption text-text-tertiary">
          표시할 랭킹이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs">
      <RankingTableHeader />

      <ul>
        {entries.map((entry) => (
          <li
            key={entry.name}
            // 긴 목록 렌더 비용 절감(성능 규칙) — 화면 밖 행은 레이아웃 계산 생략
            className="border-b border-hairline last:border-b-0 [content-visibility:auto] [contain-intrinsic-size:auto_57px]"
          >
            <Link
              href={playerPath(platform, entry.name)}
              className={`flex items-center px-6 py-3 transition-colors hover:bg-surface-subtle ${RANKING_ROW_GAP}`}
            >
              {RANKING_COLUMNS.map((column) => (
                <span key={column.key} className={column.cellClassName}>
                  {column.render(entry)}
                </span>
              ))}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
