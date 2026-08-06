// PUBG API 프록시 헬퍼 — axios로 PUBG 호출 + Upstash Redis 캐싱. 도메인 라우트(/api/pubg/*)가 공유한다.
import axios from "axios";
import { Redis } from "@upstash/redis";

const PUBG_API_KEY = process.env.PUBG_API_KEY ?? "";
const PUBG_BASE_URL = "https://api.pubg.com";
const CACHE_TTL = 60; // seconds — PUBG 응답 캐시 유지 시간

// 이 프로젝트가 지원하는 플랫폼 shard
export const SHARDS = ["steam", "kakao", "console"] as const;

// 쿼리로 들어온 shard가 유효한 값인지 검사하는 타입 가드
export function isValidShard(shard: unknown): shard is string {
  return typeof shard === "string" && (SHARDS as readonly string[]).includes(shard);
}

// Upstash Redis — UPSTASH_REDIS_REST_URL / _TOKEN 필요. 로컬 미설정 시 캐시만 건너뜀(에러 없이).
let redis: Redis | null = null;
try {
  redis = Redis.fromEnv();
} catch {
  redis = null;
}

export interface ProxyPubgOptions {
  // 기본 `pubg:{shard}:{path}:{params}` 대신 이 키로 캐시 (프리페치와 키 스킴 통일용)
  cacheKey?: string;
  // 캐시 저장·응답 전에 raw를 이 함수로 변환 (리더보드 정제 등)
  transform?: (raw: unknown) => unknown;
}

// 기본 캐시 키 — shard + path + 쿼리 조합 (같은 경로라도 필터가 다르면 다른 응답)
function buildCacheKey(
  shard: string,
  path: string,
  params: Record<string, string>,
  override?: string,
): string {
  return override ?? `pubg:${shard}:${path}:${new URLSearchParams(params).toString()}`;
}

// 캐시 조회 — 히트면 값, 미스/미설정/실패면 null (실패해도 PUBG 호출로 계속)
async function readCache(cacheKey: string): Promise<unknown> {
  if (!redis) return null;
  try {
    return (await redis.get(cacheKey)) ?? null;
  } catch {
    return null;
  }
}

// PUBG 호출 → (transform 적용) payload를 캐시에 저장하고 반환. 실패 시 throw.
async function fetchAndStore(
  shard: string,
  path: string,
  params: Record<string, string>,
  ttl: number,
  cacheKey: string,
  transform?: (raw: unknown) => unknown,
): Promise<unknown> {
  const response = await axios.get<unknown>(`${PUBG_BASE_URL}/shards/${shard}/${path}`, {
    headers: {
      Authorization: `Bearer ${PUBG_API_KEY}`,
      Accept: "application/vnd.api+json",
    },
    params,
  });
  const payload = transform ? transform(response.data) : response.data;
  if (redis) {
    try {
      await redis.setex(cacheKey, ttl, payload);
    } catch {
      // 캐시 저장 실패는 무시 — 이미 받은 응답은 그대로 반환
    }
  }
  return payload;
}

// 허용된 PUBG 하위 경로(path)만 프록시. 캐시 우선 조회 후 Response 반환.
// path 예시: 'players', 'seasons', 'matches/{id}', 'players/{id}/seasons/{seasonId}/ranked'
export async function proxyPubg(
  shard: string,
  path: string,
  params: Record<string, string> = {},
  ttl: number = CACHE_TTL,
  { cacheKey: cacheKeyOverride, transform }: ProxyPubgOptions = {},
): Promise<Response> {
  const cacheKey = buildCacheKey(shard, path, params, cacheKeyOverride);

  // 캐시 있으면 PUBG 호출 없이 반환 (rate limit 절약)
  const cached = await readCache(cacheKey);
  if (cached !== null) {
    return Response.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    const payload = await fetchAndStore(shard, path, params, ttl, cacheKey, transform);
    return Response.json(payload, {
      headers: {
        "Cache-Control": `s-maxage=${ttl}, stale-while-revalidate`,
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 500;
      const headers: Record<string, string> = {};
      // PUBG가 429(rate limit) 응답 시 Retry-After를 그대로 클라이언트에 전달
      const retryAfter = err.response?.headers?.["retry-after"];
      if (status === 429 && retryAfter) headers["Retry-After"] = String(retryAfter);
      return Response.json({ error: err.response?.data ?? err.message }, { status, headers });
    }
    return Response.json({ error: "서버 내부 오류가 발생했습니다" }, { status: 500 });
  }
}
