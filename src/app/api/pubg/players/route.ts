// 플레이어 검색 프록시 — GET /api/pubg/players?shard=&name= (또는 &ids=)
import { proxyPubg, isValidShard } from "@/lib/pubgProxy";
import { PLAYER_ID_TTL } from "@/lib/pubg/playerConstants";

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
  //
  // TTL을 서버 쪽(records.ts의 getPlayerByName)과 같은 값으로 맞춘다. 같은 조회인데 경로마다
  // 다른 값을 쓰면, 브라우저로 들어온 요청만 한도를 더 태우게 된다.
  return proxyPubg(shard, "players", params, PLAYER_ID_TTL);
}
