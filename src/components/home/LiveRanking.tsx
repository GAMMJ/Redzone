import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import LinkButton from "@/components/ui/LinkButton";
import TierLabel from "@/components/ui/TierLabel";
import { playerPath } from "@/lib/paths";
import { LIVE_RANKING } from "@/lib/mock/home";

// 홈 실시간 랭킹은 스팀 리더보드 고정(플랫폼별은 랭킹 페이지에서 선택)
const HOME_SHARD = "steam";

// 메인 "실시간 랭킹" 카드 — 상위 랭커 요약(목업). 행 클릭 시 프로필로 이동.
export default function LiveRanking() {
  return (
    <div className="rounded-lg border border-hairline bg-surface shadow-xs">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-base font-bold text-text-primary">실시간 랭킹</h2>
          <span className="text-caption text-text-tertiary">스쿼드 TPP</span>
        </div>
        <LinkButton href="/ranking" icon={ArrowRight} className="transition-opacity hover:opacity-80">
          랭킹 보기
        </LinkButton>
      </div>

      <ul>
        {LIVE_RANKING.map((entry) => (
          <li key={entry.name} className="border-t border-hairline">
            <Link
              href={playerPath(HOME_SHARD, entry.name)}
              className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-surface-subtle"
            >
              <span className="w-4 shrink-0 text-center font-mono text-sm font-medium text-text-tertiary">
                {entry.rank}
              </span>
              <Avatar alt={entry.name} />
              <span className="flex-1 truncate text-sm font-semibold text-text-primary">
                {entry.name}
              </span>
              <TierLabel
                tier={entry.tier}
                subTier={entry.subTier}
                className="w-32 text-caption text-text-secondary"
              />
              <span className="w-[70px] text-right font-mono text-sm font-bold text-primary">
                {entry.rankPoints.toLocaleString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
