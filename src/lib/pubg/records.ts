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

// 플레이어 랭크 스탯(모드별) — 플레이한 모드만 키로 존재
export async function getPlayerRanked(
  shard: string,
  playerId: string,
  seasonId: string,
): Promise<Partial<Record<RankedGameMode, RankedGameModeStats>>> {
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

// 플레이어 일반전 시즌 스탯(모드별) — 안 한 모드도 0값으로 내려올 수 있음
export async function getPlayerSeason(
  shard: string,
  playerId: string,
  seasonId: string,
): Promise<Partial<Record<GameMode, SeasonStats>>> {
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

// 홈 카드에 표시할 상위 인원 수
const HOME_LEADERBOARD_LIMIT = 10;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function toStr(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// 리더보드 raw(JSON:API) → 상위 정제 배열. data.relationships.players.data(랭크순)를
// included(순서 무보장)에 id로 조인해 rank=순서로 부여한다.
function toLeaderboardEntries(raw: unknown): LeaderboardEntry[] {
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
    });
    if (entries.length >= HOME_LEADERBOARD_LIMIT) break;
  }
  return entries;
}

// 현재 시즌 리더보드 상위(정제본). 미지원 플랫폼·조회 실패 시 빈 배열로 degrade.
export async function getLeaderboard(
  platform: string,
  gameMode: GameMode,
  seasonId: string,
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
        cacheKey: `leaderboard:${region}:${gameMode}:${seasonId}`,
        transform: toLeaderboardEntries,
      },
    );
  } catch {
    // 리더보드 조회 실패(429·네트워크 등)는 빈 목록으로 degrade
    return [];
  }
}
