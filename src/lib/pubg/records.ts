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
