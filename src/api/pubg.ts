// 클라이언트용 API 래퍼 — 브라우저는 PUBG를 직접 부르지 않고 항상 /api/pubg 를 경유한다.
import axios from "axios";
import type { MatchResponse, MatchSummariesResponse, MatchSummary } from "@/types/match";
import type { MatchTelemetry } from "@/types/telemetry";

const client = axios.create({ baseURL: "/api/pubg" });

export const pubgApi = {
  // 매치 단건 — 참가자·로스터 포함 (상세 펼침용)
  getMatch: (shard: string, matchId: string): Promise<MatchResponse> =>
    client.get<MatchResponse>("/matches", { params: { shard, id: matchId } }).then((r) => r.data),

  // 매치 여러 건의 경량 요약 — 목록 페이지 이동용
  getMatchSummaries: (
    shard: string,
    playerId: string,
    matchIds: string[],
  ): Promise<MatchSummary[]> =>
    client
      .get<MatchSummariesResponse>("/match-summaries", {
        params: { shard, playerId, ids: matchIds.join(",") },
      })
      .then((r) => r.data.data),

  // 매치 텔레메트리 요약 — 주무기·킬로그의 출처
  getTelemetry: (shard: string, matchId: string): Promise<MatchTelemetry> =>
    client
      .get<MatchTelemetry>("/telemetry", { params: { shard, id: matchId } })
      .then((r) => r.data),
};
