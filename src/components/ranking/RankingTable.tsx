import Link from "next/link";
import { playerPath } from "@/lib/paths";
import { getLeaderboard, type Loaded } from "@/lib/pubg/records";
import LoadFailure from "@/components/ui/LoadFailure";
import { RANKING_GAME_MODE, RANKING_LIMIT, type RankingPlatform } from "./rankingParams";
import { RANKING_COLUMNS, RANKING_ROW_GAP, RankingTableHeader } from "./rankingColumns";

interface RankingTableProps {
  platform: RankingPlatform;
  /** 현재 시즌. 조회 실패(failed)와 진행 중인 시즌 없음(data가 null)은 다른 화면이 된다. */
  season: Loaded<{ id: string; number: number } | null>;
}

// 경쟁전 상위 랭커 테이블(async 서버).
export default async function RankingTable({ platform, season }: RankingTableProps) {
  const entries = season.data
    ? await getLeaderboard(platform, RANKING_GAME_MODE, season.data.id, RANKING_LIMIT)
    : { data: [], failed: false };

  // 셋을 가려 말한다. 예전에는 전부 "표시할 랭킹이 없습니다"였고, 그래서 429가 났을 때
  // 사용자에게는 서비스가 텅 빈 것처럼 보였다.
  const failed = season.failed || entries.failed;

  if (failed || entries.data.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-surface shadow-xs">
        {failed ? (
          <LoadFailure message="랭킹을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." className="py-16" />
        ) : (
          <p className="px-6 py-16 text-center text-caption text-text-tertiary">
            {season.data ? "표시할 랭킹이 없습니다" : "진행 중인 시즌이 없습니다"}
          </p>
        )}
      </div>
    );
  }

  return (
    // overflow-hidden이 아니라 overflow-clip이다. 둘 다 둥근 모서리 밖을 잘라내지만,
    // hidden은 이 요소를 스크롤 컨테이너로 만들어 안쪽 sticky가 뷰포트가 아니라
    // 여기에 붙는다. 이 상자는 스크롤되지 않으니 헤더가 고정되지 않는다.
    // clip은 스크롤 컨테이너를 만들지 않아 sticky가 뷰포트 기준으로 동작한다.
    <div className="overflow-clip rounded-lg border border-hairline bg-surface shadow-xs">
      <RankingTableHeader />

      <ul>
        {entries.data.map((entry) => (
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
