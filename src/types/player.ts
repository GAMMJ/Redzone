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

// 랭크(경쟁전) 모드별 스탯 — 헤더·모드 카드에 필요한 필드 위주
export interface RankedGameModeStats {
  currentRankPoint: number;
  bestRankPoint: number;
  currentTier: RankTier;
  bestTier: RankTier;
  roundsPlayed: number;
  avgRank: number;
  top10Ratio: number;
  winRatio: number;
  wins: number;
  // kda·kdr은 랭크 응답에서 0으로 오는 경우가 많아 신뢰 불가 → K/D는 kills/deaths로 계산
  kills: number;
  deaths: number;
  // 라운드당 평균 킬(매치당 킬)
  avgKill: number;
  damageDealt: number;
}

// 일반전(시즌) 모드별 스탯 — 모드 카드에 필요한 필드 위주
export interface SeasonStats {
  roundsPlayed: number;
  wins: number;
  top10s: number;
  // 승리하지 못한 판수 (일반전엔 deaths가 없어 K/D 분모로 대용)
  losses: number;
  kills: number;
  damageDealt: number;
  headshotKills: number;
  longestKill: number;
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

// /players/{id}/seasons/{seasonId} 응답 래퍼 — gameModeStats가 게임모드별로 중첩
export interface PlayerSeasonResponse {
  data?: {
    type: string;
    attributes: {
      gameModeStats: Partial<Record<GameMode, SeasonStats>>;
    };
  };
}
