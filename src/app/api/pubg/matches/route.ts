// 매치 단건 프록시 — GET /api/pubg/matches?shard=&id=
// 목록 요약(match-summaries)과 같은 캐시 키를 쓰므로, 목록을 그린 뒤 카드를 펼치면 캐시 히트다.
import { proxyPubg, isValidShard } from "@/lib/pubgProxy";
import { MATCH_DETAIL_TTL } from "@/lib/pubg/matchConstants";
import { isValidMatchId } from "@/lib/pubg/matchId";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shard = searchParams.get("shard");
  const id = searchParams.get("id");

  if (!isValidShard(shard)) {
    return Response.json({ error: "shard는 필수입니다" }, { status: 400 });
  }
  // id가 PUBG 경로에 그대로 들어가므로 형식을 먼저 검사한다 (경로 조작 차단)
  if (!isValidMatchId(id)) {
    return Response.json({ error: "id 형식이 올바르지 않습니다" }, { status: 400 });
  }

  // 실제 PUBG 경로: /shards/{shard}/matches/{matchId}
  return proxyPubg(shard, `matches/${id}`, {}, MATCH_DETAIL_TTL);
}
