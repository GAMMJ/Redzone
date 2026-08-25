"use client";

import { useQuery } from "@tanstack/react-query";
import { pubgApi } from "@/api/pubg";
import type { MatchResponse, MatchSummary } from "@/types/match";
import type { MatchTelemetry } from "@/types/telemetry";

// 매치 상세 — 카드를 펼쳤을 때만(enabled) 조회한다.
// 종료된 매치는 불변이라 접었다 다시 펴도 재요청하지 않는다(staleTime은 queryClient 기본값).
export function useMatch(shard: string, matchId: string, enabled: boolean) {
  return useQuery<MatchResponse>({
    queryKey: ["match", shard, matchId],
    queryFn: () => pubgApi.getMatch(shard, matchId),
    enabled,
  });
}

// 매치 텔레메트리 요약 — 상세를 펼쳤을 때만 조회한다.
// 없어도 상세의 나머지는 그려야 하므로 실패를 재시도하지 않는다(404가 정상 경로다).
export function useTelemetry(shard: string, matchId: string, enabled: boolean) {
  return useQuery<MatchTelemetry>({
    queryKey: ["telemetry", shard, matchId],
    queryFn: () => pubgApi.getTelemetry(shard, matchId),
    enabled,
    retry: false,
  });
}

// 매치 요약 목록 — 첫 페이지는 서버가 이미 그렸으므로 initialData로 넘겨 재요청을 막는다.
export function useMatchSummaries(
  shard: string,
  playerId: string,
  matchIds: string[],
  initialData?: MatchSummary[],
) {
  // 서버가 요청한 수보다 적게 줬다면 일부가 실패한 것이다.
  // 그대로 두면 staleTime(5분) 동안 재요청이 없어 사용자는 새로고침 말고 회복 수단이 없다.
  // updatedAt을 0으로 주면 처음부터 stale이라 마운트 직후 한 번 다시 시도한다.
  const partial = initialData !== undefined && initialData.length < matchIds.length;
  return useQuery<MatchSummary[]>({
    // id 목록이 곧 페이지 식별자다 — 페이지가 바뀌면 키도 바뀐다
    queryKey: ["match-summaries", shard, playerId, matchIds],
    queryFn: () => pubgApi.getMatchSummaries(shard, playerId, matchIds),
    enabled: matchIds.length > 0,
    initialData,
    initialDataUpdatedAt: partial ? 0 : undefined,
    // 이전 페이지 데이터를 유지해 페이지 이동 시 목록이 통째로 사라지지 않게 한다
    placeholderData: (previous) => previous,
  });
}
