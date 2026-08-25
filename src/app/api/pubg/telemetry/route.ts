// 매치 텔레메트리 요약 — GET /api/pubg/telemetry?shard=&id=
//
// 원본은 30MB가 넘어 브라우저로 그대로 보낼 수 없다. 서버가 요약해 내려보낸다.
// 요약은 매치 단위라 그 매치의 모든 플레이어가 같은 결과를 공유한다.
import { getMatchTelemetry } from "@/lib/pubg/records";
import { isValidShard } from "@/lib/pubgProxy";
import { isValidMatchId } from "@/lib/pubg/matchId";
import { TELEMETRY_TTL } from "@/lib/pubg/matchConstants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shard = searchParams.get("shard");
  const id = searchParams.get("id");

  if (!isValidShard(shard)) {
    return Response.json({ error: "shard는 필수입니다" }, { status: 400 });
  }
  if (!isValidMatchId(id)) {
    return Response.json({ error: "id 형식이 올바르지 않습니다" }, { status: 400 });
  }

  const data = await getMatchTelemetry(shard, id);
  if (!data) {
    // 텔레메트리는 부가 정보다. 없다고 상세 전체를 실패로 만들 이유가 없어
    // 404로 알리고 화면이 그 구역만 생략하게 한다.
    return Response.json({ error: "텔레메트리를 불러오지 못했습니다" }, { status: 404 });
  }

  return Response.json(data, {
    headers: { "Cache-Control": `s-maxage=${TELEMETRY_TTL}, stale-while-revalidate` },
  });
}
