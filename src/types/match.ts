// PUBG 매치 — JSON:API 스펙(data/included/relationships)이라 필드 형태가 고정이다.
// 참가자·로스터는 data가 아니라 included 배열에 섞여 오고, type으로 구분해 꺼내야 한다.

export interface MatchAttributes {
  createdAt: string;
  // 매치 길이(초)
  duration: number;
  // official · competitive · custom · airoyale · arcade · event · training · seasonal
  matchType: string;
  // solo · duo · squad (+ -fpp), conquest 등
  gameMode: string;
  // Baltic_Main 같은 내부 코드 — 표시용 이름은 matchLabels에서 변환
  mapName: string;
  isCustomMatch: boolean;
  seasonState: string;
  shardId: string;
}

export interface Match {
  id: string;
  type: "match";
  attributes: MatchAttributes;
  relationships: {
    rosters: { data: Array<{ type: "roster"; id: string }> };
  };
}

// 한 참가자가 그 매치에서 남긴 기록 전부
export interface ParticipantStats {
  // 기절시킨 횟수 (Down But Not Out)
  DBNOs: number;
  assists: number;
  boosts: number;
  damageDealt: number;
  deathType: string;
  headshotKills: number;
  heals: number;
  // 그 매치 킬 순위 (1이면 최다 킬)
  killPlace: number;
  kills: number;
  // 한 판에서 낸 최다 연속 킬
  killStreaks: number;
  longestKill: number;
  name: string;
  playerId: string;
  revives: number;
  rideDistance: number;
  swimDistance: number;
  // 팀킬(아군 사살) 수
  teamKills: number;
  timeSurvived: number;
  walkDistance: number;
  weaponsAcquired: number;
  // 팀 최종 등수
  winPlace: number;
}

export interface Participant {
  id: string;
  type: "participant";
  attributes: {
    stats: ParticipantStats;
  };
}

export interface Roster {
  id: string;
  type: "roster";
  attributes: {
    stats: { rank: number; teamId: number };
    // PUBG가 문자열 "true"/"false"로 내려준다 (boolean 아님)
    won: string;
  };
  relationships: {
    participants: { data: Array<{ type: "participant"; id: string }> };
  };
}

export interface MatchResponse {
  data: Match;
  // 참가자와 로스터가 한 배열에 섞여 있다
  included: Array<Participant | Roster>;
}

// 목록 카드용 경량 요약 — 매치 단건을 특정 플레이어 기준으로 투영한 결과.
// 매치 단건은 참가자 100명이 통째로 와서 목록에 그대로 쓰면 응답이 너무 무겁다.
export interface MatchSummary {
  id: string;
  matchType: string;
  gameMode: string;
  mapName: string;
  createdAt: string;
  isCustomMatch: boolean;
  // 그 매치에 참가한 팀 수 — "12/25위"의 분모
  totalTeams: number;
  // 해당 플레이어가 참가자 목록에 없으면 null
  stats: {
    winPlace: number;
    kills: number;
    assists: number;
    damageDealt: number;
    headshotKills: number;
    timeSurvived: number;
  } | null;
}

export interface MatchSummariesResponse {
  data: MatchSummary[];
}
