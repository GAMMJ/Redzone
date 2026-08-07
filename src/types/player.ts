import type { GameMode } from "@/lib/constants";

// PUBG 계정 정지 상태 — 'Innocent'는 정지 이력 없음
export type BanType = "Innocent" | "TemporaryBan" | "PermanentBan";

// PUBG JSON:API 플레이어 형태
export interface Player {
  id: string;
  type: "player";
  attributes: {
    name: string;
    titleId: string;
    shardId: string;
    banType: BanType;
    patchVersion: string;
  };
}

export type RankedGameMode = GameMode;

export interface RankTier {
  tier: string;
  subTier: string;
}

// 랭크(경쟁전) 모드별 스탯 — 헤더에 필요한 필드 위주
export interface RankedGameModeStats {
  currentRankPoint: number;
  currentTier: RankTier;
  bestTier: RankTier;
  roundsPlayed: number;
  winRatio: number;
  kills: number;
  deaths: number;
}

// /players/{id}/seasons/{seasonId}/ranked 응답 래퍼
export interface PlayerRankedResponse {
  data?: {
    type: string;
    attributes: {
      rankedGameModeStats: Partial<Record<RankedGameMode, RankedGameModeStats>>;
    };
  };
}
