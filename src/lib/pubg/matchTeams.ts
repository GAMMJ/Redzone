// 매치 응답(JSON:API)을 상세 화면이 쓰는 팀 단위 구조로 정리한다.
import { deathLabel, formatSurvival } from "@/lib/pubg/matchLabels";
import type { MatchResponse, Participant, ParticipantStats, Roster } from "@/types/match";

// 팀 한 개 — 순위 + 팀 합계 + 팀원 스탯
export interface MatchTeam {
  rank: number;
  teamId: number;
  totalKills: number;
  totalDamage: number;
  members: MatchTeamMember[];
}

export interface MatchTeamMember {
  name: string;
  // 검색한 플레이어인지 — 표에서 강조한다
  isTarget: boolean;
  kills: number;
  assists: number;
  damage: number;
  headshot: number;
  dbnos: number;
  longestKill: number;
  killStreaks: number;
  teamKills: number;
  revives: number;
  survivalTime: string;
  deathLabel: string;
  // 이동 거리(m) — 팀 요약 평균 계산·표시용
  moveDistanceM: number;
}

function isParticipant(item: Participant | Roster): item is Participant {
  return item.type === "participant";
}
function isRoster(item: Participant | Roster): item is Roster {
  return item.type === "roster";
}

export function getParticipants(match: MatchResponse): Participant[] {
  return match.included.filter(isParticipant);
}

export function getRosters(match: MatchResponse): Roster[] {
  return match.included.filter(isRoster);
}

// 매치에서 특정 플레이어(accountId)의 스탯을 찾는다
export function findPlayerStats(match: MatchResponse, playerId: string): ParticipantStats | null {
  const found = getParticipants(match).find((p) => p.attributes.stats.playerId === playerId);
  return found?.attributes.stats ?? null;
}

// 팀별로 그룹핑해 순위 오름차순 팀 목록으로. 대상 플레이어에게 하이라이트 플래그를 준다.
// 팀 이름은 PUBG가 주지 않아(teamId 숫자만) 컴포넌트에서 "팀 {teamId}"로 표기한다.
export function toMatchTeams(match: MatchResponse, playerId: string): MatchTeam[] {
  const byId = new Map(getParticipants(match).map((p) => [p.id, p]));
  const rosters = [...getRosters(match)].sort(
    (a, b) => a.attributes.stats.rank - b.attributes.stats.rank,
  );

  const teams: MatchTeam[] = [];
  for (const roster of rosters) {
    const members: MatchTeamMember[] = [];
    let totalKills = 0;
    let totalDamage = 0;

    for (const ref of roster.relationships.participants.data) {
      const participant = byId.get(ref.id);
      if (!participant) continue;
      const st = participant.attributes.stats;
      totalKills += st.kills;
      totalDamage += st.damageDealt;
      members.push({
        name: st.name,
        isTarget: st.playerId === playerId,
        kills: st.kills,
        assists: st.assists,
        damage: Math.round(st.damageDealt),
        headshot: st.headshotKills,
        dbnos: st.DBNOs,
        longestKill: Math.round(st.longestKill),
        killStreaks: st.killStreaks,
        teamKills: st.teamKills,
        revives: st.revives,
        survivalTime: formatSurvival(st.timeSurvived),
        deathLabel: deathLabel(st.deathType),
        moveDistanceM: Math.round(st.walkDistance + st.rideDistance + st.swimDistance),
      });
    }
    // 팀 내에서는 킬 많은 순으로
    members.sort((a, b) => b.kills - a.kills);

    teams.push({
      rank: roster.attributes.stats.rank,
      teamId: roster.attributes.stats.teamId,
      totalKills,
      totalDamage: Math.round(totalDamage),
      members,
    });
  }
  return teams;
}
