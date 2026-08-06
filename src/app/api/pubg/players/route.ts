// 플레이어 검색 프록시 — GET /api/pubg/players?shard=&name= (또는 &ids=)
import { proxyPubg, isValidShard } from "@/lib/pubgProxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shard = searchParams.get("shard");
  const name = searchParams.get("name");
  const ids = searchParams.get("ids");

  if (!isValidShard(shard)) {
    return Response.json({ error: "shard는 필수입니다" }, { status: 400 });
  }
  // PUBG 규칙: name(닉네임)과 ids(계정ID) 중 정확히 하나만 지정
  if (!name && !ids) {
    return Response.json({ error: "name 또는 ids는 필수입니다" }, { status: 400 });
  }
  if (name && ids) {
    return Response.json({ error: "name과 ids는 동시에 사용할 수 없습니다" }, { status: 400 });
  }

  const params: Record<string, string> = name
    ? { "filter[playerNames]": name }
    : { "filter[playerIds]": ids as string };

  // 실제 PUBG 경로: /shards/{shard}/players
  return proxyPubg(shard, "players", params);
}
