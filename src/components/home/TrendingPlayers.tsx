import { Flame, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import LinkButton from "@/components/ui/LinkButton";
import { TRENDING_PLAYERS } from "@/lib/mock/home";

// 메인 "지금 뜨는 플레이어" 카드 — 검색량 급상승(목업)
export default function TrendingPlayers() {
  return (
    <div className="flex flex-col rounded-lg border border-hairline bg-surface shadow-xs">
      <div className="flex items-center gap-2 px-6 pt-5 pb-4">
        <Flame className="h-[18px] w-[18px] text-primary" />
        <h2 className="text-base font-bold text-text-primary">지금 뜨는 플레이어</h2>
      </div>

      <ul className="flex-1">
        {TRENDING_PLAYERS.map((row) => {
          const isUp = row.delta >= 0;
          return (
            <li
              key={row.rank}
              className="flex items-center gap-3 border-t border-hairline px-6 py-3"
            >
              <span className="w-4 shrink-0 font-mono text-sm text-text-tertiary">{row.rank}</span>
              <span className="flex-1 truncate text-sm font-semibold text-text-primary">
                {row.name}
              </span>
              <span
                className={`flex items-center gap-1 font-mono text-xs font-semibold ${
                  isUp ? "text-success" : "text-danger"
                }`}
              >
                {isUp ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {isUp ? `+${row.delta}` : row.delta}
              </span>
            </li>
          );
        })}
      </ul>

      <LinkButton
        href="/ranking"
        icon={ArrowRight}
        className="w-full justify-center border-t border-hairline py-3.5 transition-colors hover:bg-surface-subtle"
      >
        전체 랭킹 보기
      </LinkButton>
    </div>
  );
}
