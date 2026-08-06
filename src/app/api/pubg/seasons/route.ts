// 시즌 목록 프록시 — GET /api/pubg/seasons?shard=
import { proxyPubg, isValidShard } from "@/lib/pubgProxy";

export async function GET(request: Request) {
  const shard = new URL(request.url).searchParams.get("shard");

  if (!isValidShard(shard)) {
    return Response.json({ error: "shard는 필수입니다" }, { status: 400 });
  }

  // ttl 1800(30분) + cacheKey 통일 — 이후 프리페치/랭킹 PR이 데운 캐시를 재사용
  return proxyPubg(shard, "seasons", {}, 1800, { cacheKey: `season:list:${shard}` });
}
