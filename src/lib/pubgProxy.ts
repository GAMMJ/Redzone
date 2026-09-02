// PUBG API 프록시 헬퍼 — axios로 PUBG 호출 + Upstash Redis 캐싱. 도메인 라우트(/api/pubg/*)가 공유한다.
import "server-only"; // 클라 컴포넌트가 실수로 import하면 빌드타임 차단 (API 키 보호)
import axios from "axios";
import { Redis } from "@upstash/redis";

const PUBG_API_KEY = process.env.PUBG_API_KEY ?? "";
const PUBG_BASE_URL = "https://api.pubg.com";

// TTL에 기본값을 두지 않는다.
//
// 예전에는 60초가 기본이었는데, 그건 "적절하다"가 아니라 "정하지 않았다"는 뜻이었다.
// 세 호출이 인자를 빠뜨려 그 값을 그대로 썼고, 전적 페이지가 PUBG 호출 4회 중 3회를
// 거의 매번 새로 쓰고 있었다. 분당 한도가 10회인데 그게 조용히 새고 있었다.
//
// 필수 인자로 두면 다음에 빠뜨릴 때 컴파일이 선다. 주석으로는 못 막는다.

// ms — 개별 PUBG 호출 상한. 응답 없는 소켓 하나가 호출부를 무한정 붙잡지 못하게 막는 안전장치라
// 기본값은 넉넉히 잡는다. 짧게 잡으면 평소 느린 시간대에 정상 응답까지 끊겨,
// 닉네임 조회는 전역 에러로, 시즌 스탯은 "기록 없음"으로 둔갑한다.
// 여러 건을 병렬로 여는 호출부만 options.timeout으로 더 짧게 조인다.
const DEFAULT_TIMEOUT = 8000;

// 남은 호출 수가 이 값 이하로 떨어지면 로그에 남긴다.
// 한도는 분당 10회이고 프로필 1회가 4회를 쓰므로, 3 이하면 다음 조회가 막힐 수 있다는 뜻이다.
const RATE_LIMIT_WARN_AT = 3;

// 이 프로젝트가 지원하는 플랫폼 shard
export const SHARDS = ["steam", "kakao", "xbox", "psn"] as const;

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
  // 이 호출에만 적용할 타임아웃(ms). 기본 DEFAULT_TIMEOUT.
  timeout?: number;
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

// 한도에 얼마나 근접했는지 남긴다.
// matches 는 rate limit 대상이 아니라 헤더가 아예 없다 — 그때는 조용히 넘어간다.
// 평소에는 찍지 않고 임계 이하일 때만 남겨 로그가 묻히지 않게 한다.
function logRateLimit(shard: string, path: string, headers: unknown): void {
  const raw = (headers as Record<string, unknown> | undefined)?.["x-ratelimit-remaining"];
  const remaining = Number(raw);
  if (!Number.isFinite(remaining) || remaining > RATE_LIMIT_WARN_AT) return;
  console.warn(`[pubg] 호출 한도 임박 — 남은 ${remaining}회 (${shard}/${path})`);
}

// PUBG는 429에 Retry-After를 주지 않는다. 대신 x-ratelimit-reset(유닉스 초)으로
// 창이 언제 열리는지 알려준다. 이 값을 Retry-After 초로 환산해 클라이언트가 쓸 수 있게 한다.
// 환산하지 않으면 클라이언트는 헤더가 없다고 보고 눈감고 지수 백오프를 돈다.
function secondsUntilReset(headers: unknown): number | null {
  const reset = Number((headers as Record<string, unknown> | undefined)?.["x-ratelimit-reset"]);
  if (!Number.isFinite(reset)) return null;
  const seconds = Math.ceil(reset - Date.now() / 1000);
  return seconds > 0 ? seconds : null;
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
  timeout: number = DEFAULT_TIMEOUT,
): Promise<unknown> {
  const response = await axios.get<unknown>(`${PUBG_BASE_URL}/shards/${shard}/${path}`, {
    timeout,
    headers: {
      Authorization: `Bearer ${PUBG_API_KEY}`,
      Accept: "application/vnd.api+json",
    },
    params,
  });
  logRateLimit(shard, path, response.headers);

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

// PUBG 경로가 아닌 값도 같은 Redis에 담을 수 있게 열어둔다.
// 텔레메트리 요약처럼 CDN에서 받아 직접 가공한 결과가 여기 해당한다.
export async function readCachedValue<T>(cacheKey: string): Promise<T | null> {
  return (await readCache(cacheKey)) as T | null;
}

export async function writeCachedValue(cacheKey: string, value: unknown, ttl: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.setex(cacheKey, ttl, value);
  } catch {
    // 캐시 저장 실패는 무시 — 호출부는 이미 값을 갖고 있다
  }
}

/**
 * 키가 비어 있을 때만 쓴다(`SET ... NX`). **썼으면 true, 이미 뭔가 있어서 못 썼으면 false.**
 *
 * 한 키에 성질이 다른 두 값을 담는 자리를 위한 것이다. 조회 실패를 성공값과 같은 키에
 * 표시해 두는 곳(`steam/*`)이 그렇다 — "먼저 읽어 보고 성공값이면 안 쓴다"로 막아 두어도
 * 읽기와 쓰기 사이의 Redis 왕복 한 번이 창으로 남는다. 그 사이에 다른 요청이 성공값을 써
 * 두면 늦게 실패한 쪽이 그걸 지운다. 조건을 Redis에 맡기면 창이 없다.
 *
 * 결과를 돌려주는 것이 요점이다. 안 돌려주면 호출부가 "내가 썼나"를 알아내려고 키를 한 번
 * 더 읽어야 하는데, 그건 대개 헛읽기다 — 실패는 보통 키가 비어 있을 때 일어나고 그때는
 * 이 함수가 이긴다. false일 때만 읽으면 실패 경로마다 나가던 GET 한 번이 사라진다.
 *
 * Redis가 없으면 false다. 못 썼다는 뜻으로는 맞지만 "남이 이겼다"는 뜻은 아니므로,
 * 호출부는 false를 받았을 때 무엇이 있는지 실제로 확인해야 한다.
 */
export async function writeCachedValueIfAbsent(
  cacheKey: string,
  value: unknown,
  ttl: number,
): Promise<boolean> {
  if (!redis) return false;
  try {
    return (await redis.set(cacheKey, value, { ex: ttl, nx: true })) === "OK";
  } catch {
    // 캐시 저장 실패는 무시 — 호출부는 이미 값을 갖고 있다
    return false;
  }
}

// 서버 컴포넌트/배치용 — Response가 아닌 "데이터"를 반환하는 캐시 우선 조회. 실패 시 throw.
export async function fetchPubgCached<T = unknown>(
  shard: string,
  path: string,
  params: Record<string, string>,
  ttl: number,
  { cacheKey: cacheKeyOverride, transform, timeout }: ProxyPubgOptions = {},
): Promise<T> {
  const cacheKey = buildCacheKey(shard, path, params, cacheKeyOverride);
  const cached = await readCache(cacheKey);
  if (cached !== null) return cached as T;
  return (await fetchAndStore(shard, path, params, ttl, cacheKey, transform, timeout)) as T;
}

// 허용된 PUBG 하위 경로(path)만 프록시. 캐시 우선 조회 후 Response 반환.
// path 예시: 'players', 'seasons', 'matches/{id}', 'players/{id}/seasons/{seasonId}/ranked'
export async function proxyPubg(
  shard: string,
  path: string,
  params: Record<string, string>,
  ttl: number,
  { cacheKey: cacheKeyOverride, transform, timeout }: ProxyPubgOptions = {},
): Promise<Response> {
  const cacheKey = buildCacheKey(shard, path, params, cacheKeyOverride);

  // 캐시 있으면 PUBG 호출 없이 반환 (rate limit 절약)
  const cached = await readCache(cacheKey);
  if (cached !== null) {
    return Response.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    const payload = await fetchAndStore(shard, path, params, ttl, cacheKey, transform, timeout);
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
      if (status === 429) {
        // PUBG가 Retry-After를 주면 그대로, 아니면 reset 시각에서 환산한다.
        const retryAfter =
          err.response?.headers?.["retry-after"] ?? secondsUntilReset(err.response?.headers);
        console.warn(`[pubg] 429 한도 초과 (${shard}/${path}) — ${retryAfter ?? "?"}초 후 재시도 가능`);
        if (retryAfter) headers["Retry-After"] = String(retryAfter);
      }
      return Response.json({ error: err.response?.data ?? err.message }, { status, headers });
    }
    return Response.json({ error: "서버 내부 오류가 발생했습니다" }, { status: 500 });
  }
}
