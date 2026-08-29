import type { GameMode } from "@/lib/constants";

// 통계 페이지가 쓰는 타입 — 통산 스탯 · 무기 숙련도 · 생존 마스터리.
//
// 시즌 스탯(SeasonStats)과 겹치는 필드가 있지만 따로 둔다. 시즌 쪽은 프로필 카드에 필요한
// 아홉 개만 골라 놨고, 여기는 "통산"이라 더 많이 보여 준다 — 이동 거리·회복·부활처럼
// 한 시즌으로는 의미가 옅고 통산으로는 읽을 만한 값들이 있다.

/**
 * 통산 스탯(모드별). 원본은 35개 필드인데 그중 26개만 담는다.
 *
 * 뺀 것:
 * - `rankPoints` · `killPoints` · `winPoints` · `rankPointsTitle` — 옛 레이팅 체계 잔재라
 *   실측하면 전부 0이거나 빈 문자열이다. 화면에 0을 띄우면 "기록이 없다"로 읽힌다.
 * - `dailyKills` · `dailyWins` · `weeklyKills` · `weeklyWins` — 조회 시점에 따라 튀는 값이라
 *   통산 화면의 다른 숫자들과 성격이 어긋난다.
 * - `mostSurvivalTime` — `longestTimeSurvived`와 같은 값으로 온다.
 */
export interface LifetimeStats {
  // 판수·성적
  roundsPlayed: number;
  wins: number;
  losses: number;
  top10s: number;
  /** 플레이한 날 수 */
  days: number;

  // 전투
  kills: number;
  assists: number;
  dBNOs: number;
  headshotKills: number;
  damageDealt: number;
  longestKill: number;
  roundMostKills: number;
  maxKillStreaks: number;
  teamKills: number;
  roadKills: number;
  suicides: number;

  // 생존
  timeSurvived: number;
  longestTimeSurvived: number;
  revives: number;

  // 이동
  walkDistance: number;
  rideDistance: number;
  swimDistance: number;
  vehicleDestroys: number;

  // 소모품
  heals: number;
  boosts: number;
  weaponsAcquired: number;
}

/** `players/{id}/seasons/lifetime` 응답 래퍼 */
export interface LifetimeResponse {
  data?: {
    attributes: {
      gameModeStats: Partial<Record<GameMode, LifetimeStats>>;
    };
  };
}

/**
 * 무기 한 종의 성적. 원본이 세 갈래로 나눠 주는 것을 같은 모양으로 맞춘 것이다.
 *
 * 원본은 갈래마다 키가 다르다 — 전체(`StatsTotal`)는 `Defeats`·`LongestDefeat`를 쓰고
 * 일반전(`OfficialStatsTotal`)은 `Kills`·`LongestKill`을 쓴다. 화면에서 갈래를 바꿔 볼 수
 * 있어야 하므로 여기서 한 모양으로 맞춘다.
 */
export interface WeaponScore {
  kills: number;
  headShots: number;
  groggies: number;
  damage: number;
  /** 최장 거리(m). 전체 갈래는 `LongestDefeat`가 이 자리다. */
  longest: number;
  mostKillsInAGame: number;
}

/** 무기 한 종 — 이름·숙련도 + 갈래별 성적 */
export interface WeaponMastery {
  /** 원본 코드 (`Item_Weapon_M24_C`) — 화면 key로 쓴다 */
  code: string;
  /** 읽을 수 있는 이름 (`M24`) */
  name: string;
  xp: number;
  level: number;
  tier: number;
  /** 전체 — 안 채워지는 무기가 있다(수류탄 등) */
  total: WeaponScore;
  /** 일반전 */
  official: WeaponScore;
  /** 경쟁전 */
  competitive: WeaponScore;
}

/**
 * 생존 마스터리.
 *
 * 원본은 지표 17종(`stats`)도 함께 주지만 담지 않는다. 실측하면 61개 값 중 하나만 채워져
 * 있고 나머지는 전부 0이다 — 판수가 2,454인 계정과 26,013인 계정이 똑같았다. PUBG가 필드만
 * 남기고 값 채우기를 그만둔 자리다(랭크 응답의 kda·kdr, lifetime의 rankPoints와 같은 계열).
 *
 * `tier`는 `level`을 따라가지 않는다 — 실측하면 level 207이 tier 3인데 level 476이 tier 2다.
 * xp 순으로는 어긋나지 않아 xp를 따라가는 값으로 보인다. `level`은 500이 상한이다.
 */
export interface SurvivalMastery {
  tier: number;
  level: number;
  xp: number;
  totalMatchesPlayed: number;
}

