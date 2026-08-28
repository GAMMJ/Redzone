"use client";

import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import LoadFailure from "@/components/ui/LoadFailure";
import Pagination from "@/components/ui/Pagination";
import MatchCard from "@/components/match/MatchCard";
import MatchDetail from "@/components/player/MatchDetail";
import type { DetailTab } from "@/components/player/MatchDetail";
import SectionHeading from "@/components/player/SectionHeading";
import { useMatch, useMatchSummaries, useTelemetry } from "@/hooks/useMatch";
import { useDocumentScrollRestore } from "@/hooks/useDocumentScrollRestore";
import { rememberReturnState, useReturnState } from "@/hooks/useReturnState";
import { keepAnchored, opensElsewhere } from "@/lib/viewRestore";
import { failureMessage } from "@/lib/rateLimit";
import { RECENT_MATCHES_PAGE_SIZE as PER_PAGE } from "@/lib/pubg/matchConstants";
import {
  formatSurvival,
  isHiddenMatch,
  matchTypePrefix,
  placementVariant,
} from "@/lib/pubg/matchLabels";
import { findPlayerStats } from "@/lib/pubg/matchTeams";
import type { MatchSummary } from "@/types/match";

// 페이지 번호를 실을 쿼리 이름
const PAGE_PARAM = "page";

// 쿼리에서 읽은 페이지 번호를 쓸 수 있는 범위로 정리한다.
// 0·음수·소수·문자·범위 초과는 모두 1페이지로 본다.
function readPage(raw: string | null, totalPages: number): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return Math.min(parsed, Math.max(1, totalPages));
}

/** 뒤로 왔을 때 되살릴 화면 상태. */
interface MatchView {
  /** 펼쳐 둔 매치 id. 없으면 전부 접힌 상태 */
  match: string | null;
  tab: DetailTab;
  /** 떠날 때 문서가 놓여 있던 자리 */
  scrollY?: number;
}

const INITIAL_VIEW: MatchView = { match: null, tab: "team" };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// 적어 둔 것을 그대로 믿지 않는다.
//
// 배포로 형태가 바뀐 뒤 옛 세션이 남아 있으면 엉뚱한 값이 상태로 들어간다. tab이 셋 중
// 어느 것도 아니면 어느 탭도 선택되지 않은 화면이 되는데, 터지지 않아서 더 알아채기 어렵다.
function parseView(raw: unknown): MatchView | null {
  if (typeof raw !== "object" || raw === null) return null;
  const value = raw as Record<string, unknown>;
  const { match, tab, scrollY } = value;
  if (match !== null && typeof match !== "string") return null;
  if (tab !== "team" && tab !== "all" && tab !== "log") return null;
  // typeof NaN도 typeof Infinity도 "number"라 타입만 봐서는 걸러지지 않는다.
  // NaN이 들어오면 "문서가 이만큼 자랐나" 비교가 영원히 거짓이라 되살리기가 조용히 헛돌고,
  // 음수면 있지도 않은 자리로 스크롤한다. sessionStorage는 사람이 고칠 수 있으니 여기서 막는다.
  if (scrollY !== undefined && (!isFiniteNumber(scrollY) || scrollY < 0)) return null;
  return { match, tab, scrollY };
}

// 상세는 카드를 펼쳤을 때만 마운트된다 — 그때 매치 단건을 조회한다.
function MatchDetailLoader({
  tab,
  onTabChange,
  shard,
  matchId,
  playerId,
}: {
  shard: string;
  matchId: string;
  playerId: string;
  tab: DetailTab;
  onTabChange: (next: DetailTab) => void;
}) {
  const { data, isPending, isError, isFetching, refetch, error } = useMatch(shard, matchId, true);

  // 텔레메트리는 부가 정보라 매치 상세와 나란히 요청하고 기다리지 않는다.
  // 늦게 와도 주 무기·받은 피해 칸만 나중에 채워진다.
  const { data: telemetry } = useTelemetry(shard, matchId, true);

  if (isPending) {
    return (
      <div className="flex justify-center rounded-lg border border-hairline bg-surface py-10">
        <Spinner size="sm" />
      </div>
    );
  }

  // MatchResponse는 런타임 검증 없이 캐스팅된 값이라, included가 없으면 상세를 그리다 throw한다.
  // app/error.tsx가 받아 주긴 하지만 그 throw 하나로 프로필 페이지 전체가 오류 화면이 되므로,
  // 여기서 모양을 확인해 이 카드 안에서만 실패로 처리한다.
  const stats =
    !isError && data !== undefined && Array.isArray(data.included)
      ? findPlayerStats(data, playerId)
      : null;

  if (data === undefined || stats === null) {
    return (
      <div className="rounded-lg border border-hairline bg-surface">
        <LoadFailure
          // 한도 초과면 몇 초 뒤에 되는지 알려 준다 — 프록시가 내려보내는 값을 여태 버리고 있었다.
          message={failureMessage(error, "매치 상세")}
          // 서버 렌더가 아니라 이 조회만 다시 부른다. 카드를 접었다 펴는 걸
          // 사용자가 스스로 알아내게 두지 않는다.
          onRetry={() => void refetch()}
          pending={isFetching}
        />
      </div>
    );
  }

  return (
    <MatchDetail
      match={data}
      platform={shard}
      playerId={playerId}
      stats={stats}
      telemetry={telemetry}
      tab={tab}
      onTabChange={onTabChange}
    />
  );
}

// 최근 매치 카드 하나 — 요약(summary)만으로 렌더, 상세는 펼칠 때 지연 조회
function RecentMatchCard({
  expanded,
  onToggle,
  tab,
  onTabChange,
  shard,
  summary,
  playerId,
}: {
  shard: string;
  summary: MatchSummary;
  playerId: string;
  expanded: boolean;
  onToggle: () => void;
  tab: DetailTab;
  onTabChange: (next: DetailTab) => void;
}) {
  const s = summary.stats;
  if (!s) return null;

  return (
    <MatchCard
      expanded={expanded}
      onToggle={onToggle}
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
        <MatchDetailLoader
          shard={shard}
          matchId={summary.id}
          playerId={playerId}
          tab={tab}
          onTabChange={onTabChange}
        />
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
  const sectionRef = useRef<HTMLElement>(null);
  const totalPages = Math.ceil(matchIds.length / PER_PAGE);

  // 시작 페이지는 URL에서 읽는다 — 새로고침해도 유지되고 주소 공유가 된다.
  // 이후 이동은 상태로 관리하고 URL은 뒤따라 맞춘다(handlePage 주석 참고).
  const searchParams = useSearchParams();
  const [page, setPage] = useState(() => readPage(searchParams.get(PAGE_PARAM), totalPages));
  const pageIds = matchIds.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // 펼침과 탭은 주소에 담지 않는다. 담으면 새로고침해도 열린 채로 떠서,
  // "처음부터 다시"라는 새로고침의 뜻과 어긋나고 상세를 다시 불러오느라 호출까지 쓴다.
  // 링크를 눌러 나갈 때만 적어 두고, 뒤로 왔을 때 한 번 쓰고 지운다.
  const [view, setView] = useReturnState<MatchView>(playerId, INITIAL_VIEW, parseView);
  const expandedId = view.match;
  const tab = view.tab;

  // 현재 페이지 매치의 경량 요약만 한 요청으로 조회
  // (페이지 이동 시 다음 10개를 새로 조회, 뒤로 오면 캐시 히트)
  const {
    data: summaries,
    isLoading,
    isPlaceholderData,
    isFetching: summariesFetching,
    refetch: refetchSummaries,
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

  // 주소만 바꾼다. router.replace를 쓰면 쿼리가 바뀔 때마다 서버 왕복이 일어나 프로필 SSR이
  // 통째로 다시 돈다(handlePage 주석 참고). 그 비용을 카드 펼칠 때마다 낼 수는 없다.
  function syncUrl(page: number) {
    const params = new URLSearchParams(searchParams);
    if (page <= 1) params.delete(PAGE_PARAM);
    else params.set(PAGE_PARAM, String(page));
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }

  // 한 번에 한 장만 펼친다. 다시 누르면 접힌다.
  //
  // 새로 펼친 카드는 언제나 첫 탭에서 연다. 카드마다 탭을 따로 들고 있던 예전 동작과 같다.
  // 탭까지 이어 두면 앞 카드에서 로그를 보다 접고 다른 카드를 열었을 때 그쪽도 로그로 열린다.
  function handleToggle(matchId: string) {
    setView((prev) =>
      prev.match === matchId
        ? { ...prev, match: null }
        : { ...prev, match: matchId, tab: INITIAL_VIEW.tab },
    );
  }

  function handleTab(next: DetailTab) {
    setView((prev) => ({ ...prev, tab: next }));
  }

  // 뒤로 왔을 때 문서를 보던 자리로 되돌린다.
  //
  // 브라우저도 스크롤을 되돌리지만 카드가 아직 접혀 있을 때라 문서가 짧아 어긋난다.
  // 펼침이 되살아나 문서가 다시 길어진 뒤에 맞춰야 한다.
  useDocumentScrollRestore(view.scrollY, playerId);

  // 참가자를 눌러 나가는 순간의 상태를 적어 둔다. 뒤로 오면 이걸로 되살린다.
  //
  // 상태가 바뀔 때마다 적지 않는 이유는, 그러면 새로고침에도 남아 새로고침이 처음 상태로
  // 돌아가지 않기 때문이다. 나가는 순간에만 적으면 그 문제가 없다.
  function handleSectionClick(event: ReactMouseEvent<HTMLElement>) {
    // 새 탭으로 열리는 클릭은 이 화면을 떠나지 않는다. 그때 적어 두면 나중에 되살아난다.
    if (opensElsewhere(event)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest('a[href^="/player/"]')) {
      rememberReturnState(playerId, { ...view, scrollY: Math.round(window.scrollY) });
      return;
    }

    // 상세보기를 누르면 위에서 펼쳐져 있던 카드가 접히며 목록이 위로 당겨진다.
    // 방금 누른 카드는 제자리에 있어야 한다.
    const toggle = target.closest("button[aria-expanded]");
    if (toggle instanceof HTMLElement) keepAnchored(toggle);
  }

  function handlePage(next: number) {
    setPage(next);
    // 페이지를 옮기면 펼쳐 둔 카드는 이 페이지에 없다. 같이 접는다.
    setView({ match: null, tab: "team" });
    syncUrl(next);

    // 페이지 이동 시 "최근 매치" 제목이 상단에 오도록 스크롤
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section ref={sectionRef} onClickCapture={handleSectionClick} className="flex flex-col gap-4">
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
            <LoadFailure
              inline
              message={`이 페이지의 매치 ${missingCount}건을 불러오지 못했습니다`}
              onRetry={() => void refetchSummaries()}
              pending={summariesFetching}
            />
          )}
          {/* 카드 사이 간격(gap-3)은 헤더→첫 카드 간격(gap-4)과 별도로 유지 */}
          {/* 전환 중에는 이전 페이지 카드가 그대로 남으므로 흐리게 해 아직 갱신 전임을 알린다 */}
          <div className={`flex flex-col gap-3 ${isPlaceholderData ? "opacity-50" : ""}`}>
            {pageItems.length === 0 ? (
              <p className="text-caption text-text-tertiary">{emptyMessage()}</p>
            ) : (
              pageItems.map((m) => (
                <RecentMatchCard
                  key={m.id}
                  shard={shard}
                  summary={m}
                  playerId={playerId}
                  expanded={expandedId === m.id}
                  onToggle={() => handleToggle(m.id)}
                  tab={tab}
                  onTabChange={handleTab}
                />
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
