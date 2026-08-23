// 매치 배치 요약 프록시 — GET /api/pubg/match-summaries?shard=&playerId=&ids=a,b,c
// 목록이 매치 상세 N개를 각각 받아 무거워지지 않도록, 서버가 캐시 우선으로 모아
// 플레이어 기준으로 투영한 요약만 내려보낸다.
import { getMatchSummaries } from "@/lib/pubg/records";
import { MATCH_CACHE_TTL, MAX_SUMMARY_IDS } from "@/lib/pubg/matchConstants";
import { isValidShard } from "@/lib/pubgProxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shard = searchParams.get("shard");
  const playerId = searchParams.get("playerId");
  const ids = searchParams.get("ids");

  if (!isValidShard(shard)) {
    return Response.json({ error: "shard는 필수입니다" }, { status: 400 });
  }
  if (!playerId) {
    return Response.json({ error: "playerId는 필수입니다" }, { status: 400 });
  }
  if (!ids) {
    return Response.json({ error: "ids는 필수입니다" }, { status: 400 });
  }

  const idList = ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_SUMMARY_IDS);

  // 개별 매치 실패는 getMatchSummaries가 건너뛴다 → 여기서는 항상 200이다.
  const data = await getMatchSummaries(shard, playerId, idList);

  return Response.json(
    { data },
    { headers: { "Cache-Control": `s-maxage=${MATCH_CACHE_TTL}, stale-while-revalidate` } },
  );
}
