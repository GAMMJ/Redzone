import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import LinkButton from "@/components/ui/LinkButton";
import TierLabel from "@/components/ui/TierLabel";
import { playerPath } from "@/lib/paths";
import { getLeaderboard, type Loaded } from "@/lib/pubg/records";
import LoadFailure from "@/components/ui/LoadFailure";
import { PLATFORM_LABEL } from "@/lib/constants";
import type { Platform } from "@/lib/constants";
import { LEADERBOARD_COL as COL } from "./leaderboardColumns";

interface LiveRankingProps {
  // 어느 플랫폼 리더보드인지 (steam·kakao) — 카드마다 다르게 표시
  platform: Platform;
  /**
   * 현재 시즌(id·번호). (steam·kakao 모두 PC 시즌 공유)
   *
   * 조회 실패(failed)와 진행 중인 시즌 없음(data가 null)은 다른 화면이 된다.
   * 실패는 리더보드 조회를 건너뛰되 "랭킹이 없다"고 말하지 않는다.
   */
  season: Loaded<{ id: string; number: number } | null>;
}

// 플랫폼별 브랜드 아이콘 — public/icons. Steam은 정사각 로고, Kakao는 워드마크 앞 "k" 글자라 폭이 좁음.
// (콘솔은 홈 랭킹 미노출이라 없음)
const PLATFORM_ICON: Partial<
  Record<Platform, { src: string; width: number; height: number }>
> = {
  steam: { src: "/icons/steam.svg", width: 20, height: 20 },
  kakao: { src: "/icons/kakao.svg", width: 11, height: 20 },
};

// 메인 "실시간 랭킹" 카드 — 플랫폼별 상위 랭커 요약(실 리더보드). 행 클릭 시 프로필로 이동.
export default async function LiveRanking({
  platform,
  season,
}: LiveRankingProps) {
  const entries = season.data
    ? await getLeaderboard(platform, "squad", season.data.id)
    : { data: [], failed: false };
  // 실패 / 진행 중인 시즌 없음 / 0건을 가려 말한다. 셋을 한 문구로 뭉치면 429가 났을 때
  // 사용자에게는 랭킹이 텅 빈 것으로 보인다.
  const failed = season.failed || entries.failed;
  const icon = PLATFORM_ICON[platform];

  return (
    <div className="rounded-lg border border-hairline bg-surface shadow-xs">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <h2 className="flex items-center gap-4 text-base font-bold text-text-primary">
          {icon && (
            // next/image는 Vercel 무료 최적화 한도로 금지(CLAUDE.md) → 일반 img
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={icon.src}
              alt=""
              width={icon.width}
              height={icon.height}
              className="shrink-0"
            />
          )}
          {PLATFORM_LABEL[platform]} 실시간 랭킹
        </h2>
        <LinkButton
          href="/ranking"
          icon={ArrowRight}
          className="transition-opacity hover:opacity-80"
        >
          랭킹 보기
        </LinkButton>
      </div>

      {failed ? (
        <LoadFailure
          message="랭킹을 불러오지 못했습니다."
          className="border-t border-hairline"
        />
      ) : entries.data.length === 0 ? (
        <p className="border-t border-hairline px-6 py-8 text-center text-caption text-text-tertiary">
          {season.data ? "표시할 랭킹이 없습니다" : "진행 중인 시즌이 없습니다"}
        </p>
      ) : (
        <>
          {/* 컬럼 헤더 — 행과 동일한 컬럼 폭 공유 */}
          <div className="flex items-center border-y border-hairline bg-primary-soft px-6 py-2.5 text-xs font-semibold tracking-[0.3px] text-primary">
            <span className={COL.rank}>순위</span>
            <span className="flex-1">닉네임</span>
            <span className={COL.tier}>티어</span>
            <span className={COL.rp}>RP</span>
          </div>

          <ul>
            {entries.data.map((entry) => (
              <li
                key={entry.name}
                className="border-b border-hairline last:border-b-0"
              >
                <Link
                  href={playerPath(platform, entry.name)}
                  className="flex items-center px-6 py-3 transition-colors hover:bg-surface-subtle"
                >
                  <span
                    className={`${COL.rank} font-mono text-sm font-medium text-text-tertiary`}
                  >
                    {entry.rank}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar alt={entry.name} />
                    <span className="truncate text-sm font-semibold text-text-primary">
                      {entry.name}
                    </span>
                  </div>
                  <TierLabel
                    tier={entry.tier}
                    subTier={entry.subTier}
                    className={`${COL.tier} text-caption text-text-secondary`}
                  />
                  <span
                    className={`${COL.rp} font-mono text-sm font-bold text-primary`}
                  >
                    {entry.rankPoints.toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
