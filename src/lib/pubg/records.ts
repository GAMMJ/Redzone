import "server-only";
import axios from "axios";
import { fetchPubgCached } from "@/lib/pubgProxy";
import type { GameMode } from "@/lib/constants";
import type {
  Player,
  PlayerRankedResponse,
  PlayerSeasonResponse,
  RankedGameMode,
  RankedGameModeStats,
  SeasonStats,
} from "@/types/player";
import type { LeaderboardEntry } from "@/types/leaderboard";
import type { MatchSummary } from "@/types/match";
import { isValidMatchId } from "@/lib/pubg/matchId";
import {
  MATCH_BATCH_TIMEOUT,
  MATCH_SUMMARY_SCHEMA_VERSION,
  MATCH_SUMMARY_TTL,
  MAX_SUMMARY_IDS,
} from "@/lib/pubg/matchConstants";

interface SeasonsResponse {
  data?: Array<{ id: string; attributes: { isCurrentSeason: boolean } }>;
}
interface PlayersResponse {
  data?: Player[];
}

// 닉네임으로 플레이어 조회 — 없으면 null (PUBG는 존재하지 않는 닉네임에 404를 반환)
export async function getPlayerByName(shard: string, name: string): Promise<Player | null> {
  try {
    const res = await fetchPubgCached<PlayersResponse>(shard, "players", {
      "filter[playerNames]": name,
    });
    return res.data?.[0] ?? null;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

// 현재 시즌 id — 없으면 null. seasons 캐시키는 라우트와 통일(30분).
export async function getCurrentSeasonId(shard: string): Promise<string | null> {
  try {
    const res = await fetchPubgCached<SeasonsResponse>(shard, "seasons", {}, 1800, {
      cacheKey: `season:list:${shard}`,
    });
    return res.data?.find((season) => season.attributes.isCurrentSeason)?.id ?? null;
  } catch {
    // 시즌 조회 실패(429·네트워크 등)는 티어 생략으로 degrade — 헤더 자체는 렌더
    return null;
  }
}

// 시즌 id 끝자리 = 시즌 번호 ("division.bro.official.pc-2018-33" → 33)
function parseSeasonNumber(id: string): number {
  const matched = id.match(/(\d+)$/);
  return matched ? Number(matched[1]) : 0;
}

// 현재 시즌 id + 번호 — 홈 시즌 배지/부제용. 없거나 실패 시 null.
export async function getCurrentSeason(
  shard: string,
): Promise<{ id: string; number: number } | null> {
  const id = await getCurrentSeasonId(shard);
  if (!id) return null;
  return { id, number: parseSeasonNumber(id) };
}

// 플레이어 랭크 스탯(모드별) — 플레이한 모드만 키로 존재.
// seasonId가 null(시즌 조회 실패)이면 호출부가 분기하지 않도록 여기서 빈 값으로 degrade한다.
export async function getPlayerRanked(
  shard: string,
  playerId: string,
  seasonId: string | null,
): Promise<Partial<Record<RankedGameMode, RankedGameModeStats>>> {
  if (!seasonId) return {};
  try {
    const res = await fetchPubgCached<PlayerRankedResponse>(
      shard,
      `players/${playerId}/seasons/${seasonId}/ranked`,
    );
    return res.data?.attributes?.rankedGameModeStats ?? {};
  } catch {
    // 랭크 조회 실패(429·네트워크 등)는 티어 생략으로 degrade
    return {};
  }
}

// 플레이어 일반전 시즌 스탯(모드별) — 안 한 모드도 0값으로 내려올 수 있음.
// seasonId가 null이면 랭크 쪽과 같은 이유로 빈 값으로 degrade한다.
export async function getPlayerSeason(
  shard: string,
  playerId: string,
  seasonId: string | null,
): Promise<Partial<Record<GameMode, SeasonStats>>> {
  if (!seasonId) return {};
  try {
    const res = await fetchPubgCached<PlayerSeasonResponse>(
      shard,
      `players/${playerId}/seasons/${seasonId}`,
    );
    return res.data?.attributes?.gameModeStats ?? {};
  } catch {
    // 시즌 스탯 조회 실패(429·네트워크 등)는 일반전 카드 생략으로 degrade
    return {};
  }
}

// PUBG 리더보드는 일반 shard(steam 등)로는 400(ShardID 누락)이라 리전 shard를 요구한다.
// steam은 한국 리더보드가 비어 아시아(pc-as)로, kakao는 pc-kakao로 매핑. console은 후속.
const LEADERBOARD_REGION: Record<string, string> = {
  steam: "pc-as",
  kakao: "pc-kakao",
};

// getLeaderboard limit 기본값 — 홈 카드는 상위 10명, 랭킹 페이지는 100명 전달.
const DEFAULT_LEADERBOARD_LIMIT = 10;

// 캐시에는 transform을 거친 LeaderboardEntry[]가 저장되고, 캐시 히트 시엔 검증 없이 캐스팅만 한다.
// 따라서 LeaderboardEntry의 필드가 바뀌면 옛 모양의 캐시가 TTL 동안 그대로 나가 런타임 에러가 난다.
// → 엔트리 모양을 바꿀 때마다 이 버전을 올려 캐시를 무효화할 것.
const LEADERBOARD_SCHEMA_VERSION = "v3";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function toStr(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// 리더보드 raw(JSON:API) → 상위 limit개 정제 배열. data.relationships.players.data(랭크순)를
// included(순서 무보장)에 id로 조인해 rank=순서로 부여한다.
function toLeaderboardEntries(raw: unknown, limit: number): LeaderboardEntry[] {
  if (!isRecord(raw)) return [];
  const data = isRecord(raw.data) ? raw.data : null;
  const relationships = data && isRecord(data.relationships) ? data.relationships : null;
  const players = relationships && isRecord(relationships.players) ? relationships.players : null;
  const refs = players && Array.isArray(players.data) ? players.data : [];
  const included = Array.isArray(raw.included) ? raw.included : [];

  const byId = new Map<string, Record<string, unknown>>();
  for (const item of included) {
    if (isRecord(item) && typeof item.id === "string") byId.set(item.id, item);
  }

  const entries: LeaderboardEntry[] = [];
  for (const ref of refs) {
    if (!isRecord(ref) || typeof ref.id !== "string") continue;
    const player = byId.get(ref.id);
    if (!player) continue;
    const attributes = isRecord(player.attributes) ? player.attributes : null;
    if (!attributes) continue;
    const stats: Record<string, unknown> = isRecord(attributes.stats) ? attributes.stats : {};
    entries.push({
      rank: entries.length + 1,
      name: toStr(attributes.name),
      tier: toStr(stats.tier),
      subTier: toStr(stats.subTier),
      rankPoints: toNumber(stats.rankPoints),
      games: toNumber(stats.games),
      averageDamage: toNumber(stats.averageDamage),
      averageKill: toNumber(stats.averageKill),
      winRatio: toNumber(stats.winRatio),
    });
    if (entries.length >= limit) break;
  }
  return entries;
}

// 현재 시즌 리더보드 상위 limit개(정제본). 미지원 플랫폼·조회 실패 시 빈 배열로 degrade.
export async function getLeaderboard(
  platform: string,
  gameMode: GameMode,
  seasonId: string,
  limit: number = DEFAULT_LEADERBOARD_LIMIT,
): Promise<LeaderboardEntry[]> {
  const region = LEADERBOARD_REGION[platform];
  if (!region) return [];
  try {
    return await fetchPubgCached<LeaderboardEntry[]>(
      region,
      `leaderboards/${seasonId}/${gameMode}`,
      {},
      1800,
      {
        // limit별 캐시 분리 — 홈(10건)과 랭킹(100건)이 서로를 덮어쓰지 않게 한다.
        cacheKey: `leaderboard:${LEADERBOARD_SCHEMA_VERSION}:${region}:${gameMode}:${seasonId}:${limit}`,
        transform: (raw) => toLeaderboardEntries(raw, limit),
      },
    );
  } catch {
    // 리더보드 조회 실패(429·네트워크 등)는 빈 목록으로 degrade
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// 매치 (최근 전적)
// ─────────────────────────────────────────────────────────────

// 플레이어 응답에 실려 온 최근 매치 ID(최신순). PUBG엔 매치 목록 엔드포인트가 없다.
export function getPlayerMatchIds(player: Player): string[] {
  const refs = player.relationships?.matches?.data;
  if (!Array.isArray(refs)) return [];
  return refs.map((ref) => ref.id).filter((id): id is string => typeof id === "string");
}

// 매치 원본(JSON:API) → 특정 플레이어 기준 요약. 형태가 어긋나면 null.
// 참가자와 로스터가 included 한 배열에 섞여 오므로 type으로 갈라 처리한다.
function toMatchSummary(raw: unknown, playerId: string): MatchSummary | null {
  if (!isRecord(raw)) return null;
  const data = isRecord(raw.data) ? raw.data : null;
  if (!data || typeof data.id !== "string") return null;
  const attributes = isRecord(data.attributes) ? data.attributes : null;
  if (!attributes) return null;

  const included = Array.isArray(raw.included) ? raw.included : [];
  let totalTeams = 0;
  let stats: MatchSummary["stats"] = null;

  for (const item of included) {
    if (!isRecord(item)) continue;

    // 로스터 하나 = 팀 하나. 등수 분모로 쓴다.
    if (item.type === "roster") {
      totalTeams += 1;
      continue;
    }
    if (item.type !== "participant" || stats) continue;

    const itemAttributes = isRecord(item.attributes) ? item.attributes : null;
    const participantStats =
      itemAttributes && isRecord(itemAttributes.stats) ? itemAttributes.stats : null;
    // 조회 대상 플레이어의 기록일 때만 채택
    if (!participantStats || participantStats.playerId !== playerId) continue;

    stats = {
      winPlace: toNumber(participantStats.winPlace),
      kills: toNumber(participantStats.kills),
      assists: toNumber(participantStats.assists),
      damageDealt: toNumber(participantStats.damageDealt),
      headshotKills: toNumber(participantStats.headshotKills),
      timeSurvived: toNumber(participantStats.timeSurvived),
    };
  }

  return {
    id: data.id,
    matchType: toStr(attributes.matchType),
    gameMode: toStr(attributes.gameMode),
    mapName: toStr(attributes.mapName),
    createdAt: toStr(attributes.createdAt),
    isCustomMatch: attributes.isCustomMatch === true,
    totalTeams,
    stats,
  };
}

// 매치 여러 건을 캐시 우선으로 모아 요약으로 투영한다.
// 개별 실패(429 등)는 건너뛴다 — 한 건 때문에 목록 전체가 비는 것보다 낫고,
// 성공한 건은 캐시에 남아 다음 방문에 회복된다.
export async function getMatchSummaries(
  shard: string,
  playerId: string,
  matchIds: string[],
): Promise<MatchSummary[]> {
  // 형식이 어긋난 id는 PUBG 경로에 넣기 전에 떨군다
  const targets = matchIds.filter(isValidMatchId).slice(0, MAX_SUMMARY_IDS);
  if (targets.length === 0) return [];

  // 원본(약 63KB)이 아니라 투영한 요약(약 200바이트)을 캐시한다.
  // 원본을 캐시하면 목록 한 페이지를 그릴 때마다 630KB를 읽어와 2KB로 줄이는 셈이 된다.
  //
  // 요약은 플레이어 기준 투영이라 캐시 키에 playerId가 들어간다.
  // 같은 매치라도 사람마다 다른 요약이 나오므로 키를 공유할 수 없다.
  const settled = await Promise.allSettled(
    targets.map((id) =>
      fetchPubgCached<MatchSummary | null>(shard, `matches/${id}`, {}, MATCH_SUMMARY_TTL, {
        cacheKey: `match:sum:${MATCH_SUMMARY_SCHEMA_VERSION}:${shard}:${playerId}:${id}`,
        transform: (raw) => toMatchSummary(raw, playerId),
        timeout: MATCH_BATCH_TIMEOUT,
      }),
    ),
  );

  // 실패는 화면에서 "N건을 불러오지 못했습니다"로 사용자에게 보이지만 서버 로그에는 안 남는다.
  // 원인(타임아웃·네트워크·형태 불일치)을 나중에 추적하려면 여기서 한 줄 남겨야 한다.
  const rejected = settled.filter((result) => result.status === "rejected").length;
  if (rejected > 0) {
    console.warn(`[pubg] 매치 요약 ${rejected}/${targets.length}건 조회 실패 (${shard} ${playerId})`);
  }

  // allSettled는 입력 순서를 지키므로 최신순이 그대로 유지된다.
  // stats가 없는 요약(대상 플레이어가 그 매치 참가자에 없음)은 카드로 그릴 수 없어 여기서 뗀다.
  // 남겨두면 화면 단에서 조용히 사라져 "몇 건이 빠졌는지" 셈이 어긋난다.
  //
  // 결과가 요청보다 짧아지는 경로는 넷이다 — 조회 실패(네트워크·타임아웃), stats 없음,
  // toMatchSummary 형태 불일치, isValidMatchId 탈락. 화면에는 모두 "불러오지 못했습니다"로 수렴한다.
  //
  // transform이 null을 내면 캐시에 남지 않아 다음에도 다시 부른다.
  // 형태가 깨진 매치에 한정되고 매치 호출은 한도를 안 쓰므로 그대로 둔다.
  return settled
    .filter((result): result is PromiseFulfilledResult<MatchSummary | null> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((summary): summary is MatchSummary => summary !== null && summary.stats !== null);
}
