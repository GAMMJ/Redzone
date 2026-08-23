"use client";

import { useRef, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import MatchCard from "@/components/match/MatchCard";
import MatchDetail from "@/components/player/MatchDetail";
import SectionHeading from "@/components/player/SectionHeading";
import { useMatch, useMatchSummaries } from "@/hooks/useMatch";
import { RECENT_MATCHES_PAGE_SIZE as PER_PAGE } from "@/lib/pubg/matchConstants";
import {
  formatSurvival,
  isHiddenMatch,
  matchTypePrefix,
  placementVariant,
} from "@/lib/pubg/matchLabels";
import { findPlayerStats } from "@/lib/pubg/matchTeams";
import type { MatchSummary } from "@/types/match";

// 상세는 카드를 펼쳤을 때만 마운트된다 — 그때 매치 단건을 조회한다.
function MatchDetailLoader({
  shard,
  matchId,
  playerId,
}: {
  shard: string;
  matchId: string;
  playerId: string;
}) {
  const { data, isPending, isError } = useMatch(shard, matchId, true);

  if (isPending) {
    return (
      <div className="flex justify-center rounded-lg border border-hairline bg-surface py-10">
        <Spinner size="sm" />
      </div>
    );
  }

  // MatchResponse는 런타임 검증 없이 캐스팅된 값이라, included가 없으면 상세를 그리다 throw한다.
  // 아직 app/error.tsx가 없어서 그 throw 하나가 프로필 페이지 전체를 날린다.
  const stats =
    !isError && data !== undefined && Array.isArray(data.included)
      ? findPlayerStats(data, playerId)
      : null;

  if (data === undefined || stats === null) {
    return (
      <p className="rounded-lg border border-hairline bg-surface py-8 text-center text-caption text-text-tertiary">
        매치 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }

  return <MatchDetail match={data} playerId={playerId} stats={stats} />;
}

// 최근 매치 카드 하나 — 요약(summary)만으로 렌더, 상세는 펼칠 때 지연 조회
function RecentMatchCard({
  shard,
  summary,
  playerId,
}: {
  shard: string;
  summary: MatchSummary;
  playerId: string;
}) {
  const s = summary.stats;
  if (!s) return null;

  return (
    <MatchCard
      placement={s.winPlace}
      totalTeams={summary.totalTeams}
      placementVariant={placementVariant(s.winPlace)}
      gameMode={summary.gameMode}
      mapName={summary.mapName}
      kills={s.kills}
      assists={s.assists}
      damage={Math.round(s.damageDealt)}
      headshot={s.headshotKills}
      survivalTime={formatSurvival(s.timeSurvived)}
      playedAt={summary.createdAt}
      modePrefix={matchTypePrefix(summary.matchType, summary.gameMode)}
      expandedContent={() => (
        <MatchDetailLoader shard={shard} matchId={summary.id} playerId={playerId} />
      )}
    />
  );
}

interface RecentMatchesProps {
  shard: string;
  playerId: string;
  // 최근 매치 ID 전체(최신순) — 페이지네이션의 기준
  matchIds: string[];
  // 서버가 미리 그린 첫 페이지. 넘겨주면 첫 렌더에서 재요청하지 않는다.
  initialSummaries: MatchSummary[];
}

export default function RecentMatches({
  shard,
  playerId,
  matchIds,
  initialSummaries,
}: RecentMatchesProps) {
  const [page, setPage] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);

  const totalPages = Math.ceil(matchIds.length / PER_PAGE);
  const pageIds = matchIds.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // 현재 페이지 매치의 경량 요약만 한 요청으로 조회
  // (페이지 이동 시 다음 10개를 새로 조회, 뒤로 오면 캐시 히트)
  const {
    data: summaries,
    isLoading,
    isPlaceholderData,
  } = useMatchSummaries(
    shard,
    playerId,
    pageIds,
    page === 1 ? initialSummaries : undefined,
  );

  const loaded = summaries ?? [];

  // 숨김(커스텀/훈련/튜토리얼)만 제외 — 이번 페이지 결과 안에서 걸러서 그대로 렌더
  const pageItems = loaded.filter((m) => !isHiddenMatch(m.matchType, m.isCustomMatch));

  // 요약 조회는 개별 매치 실패를 건너뛰므로, 요청한 수보다 적게 오면 그만큼 못 불러온 것이다.
  // 서버가 알려주지 않아도 요청한 id 수와 받은 수를 비교하면 클라에서 알 수 있다.
  //
  // 단 placeholder 구간(페이지 전환 중)에는 loaded가 아직 이전 페이지 것이라 pageIds와 짝이 안 맞는다.
  // 이때 빼면 실패한 게 없는데도 그 차이만큼 "못 불러왔다"고 표시된다.
  const missingCount =
    !isPlaceholderData && loaded.length > 0 ? pageIds.length - loaded.length : 0;

  // 카드가 하나도 없는 이유가 셋이라 문구를 나눈다. 전부 "매치가 없습니다"로 뭉치면
  // 전적이 없는 것인지 못 불러온 것인지 사용자가 구분할 수 없다.
  // (총 페이지 수는 조회 전 id 개수 기준이라, 숨김 매치가 몰린 페이지는 비어 보일 수 있다)
  function emptyMessage(): string {
    if (matchIds.length === 0) return "최근 매치가 없습니다";
    if (loaded.length === 0) return "전적을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요";
    return "이 페이지에는 표시할 매치가 없습니다";
  }

  function handlePage(next: number) {
    setPage(next);
    // 페이지 이동 시 "최근 매치" 제목이 상단에 오도록 스크롤
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section ref={sectionRef} className="flex flex-col gap-4">
      <SectionHeading>최근 매치</SectionHeading>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: pageIds.length || PER_PAGE }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-26 animate-pulse rounded-lg border border-hairline bg-surface-muted"
            />
          ))}
        </div>
      ) : (
        <>
          {missingCount > 0 && (
            <p className="text-caption text-text-tertiary">
              이 페이지의 매치 {missingCount}건을 불러오지 못했습니다
            </p>
          )}
          {/* 카드 사이 간격(gap-3)은 헤더→첫 카드 간격(gap-4)과 별도로 유지 */}
          {/* 전환 중에는 이전 페이지 카드가 그대로 남으므로 흐리게 해 아직 갱신 전임을 알린다 */}
          <div className={`flex flex-col gap-3 ${isPlaceholderData ? "opacity-50" : ""}`}>
            {pageItems.length === 0 ? (
              <p className="text-caption text-text-tertiary">{emptyMessage()}</p>
            ) : (
              pageItems.map((m) => (
                <RecentMatchCard key={m.id} shard={shard} summary={m} playerId={playerId} />
              ))
            )}
          </div>
          {/* 페이지네이션은 카드 유무와 무관하게 둔다.
              숨김 매치만 있는 페이지에서 사라지면 사용자가 그 페이지에서 빠져나올 수 없다. */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePage} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
