"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Trophy } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { formatMapName, formatSurvival, gameModeFullLabel } from "@/lib/pubg/matchLabels";
import { toMatchTeams } from "@/lib/pubg/matchTeams";
import type { MatchTeam, MatchTeamMember } from "@/lib/pubg/matchTeams";
import type { MatchResponse, ParticipantStats } from "@/types/match";

interface MatchDetailProps {
  match: MatchResponse;
  playerId: string;
  stats: ParticipantStats;
}

type DetailTab = "team" | "all";

// 상단 요약 8칸 — 매치 API stats로 되는 것만 (받은 피해는 텔레메트리라 제외)
function summaryStats(s: ParticipantStats): { label: string; value: string | number }[] {
  const moveKm = ((s.walkDistance + s.rideDistance + s.swimDistance) / 1000).toFixed(1);
  return [
    { label: "킬", value: s.kills },
    { label: "어시스트", value: s.assists },
    { label: "딜량", value: Math.round(s.damageDealt) },
    { label: "생존", value: formatSurvival(s.timeSurvived) },
    { label: "헤드샷", value: s.headshotKills },
    { label: "DBNO", value: s.DBNOs },
    { label: "부활", value: s.revives },
    { label: "이동 거리", value: `${moveKm}km` },
  ];
}

// 팀 순위 → 배지 색상/라벨
function placementTag(rank: number): { chip: string; label: string } | null {
  if (rank === 1) return { chip: "text-place-win-fg", label: "우승" };
  if (rank <= 10) return { chip: "text-place-top10-fg", label: "Top 10" };
  return null;
}

// 팀 헤더 배경 — 우리 팀은 진한 primary(내 플레이어 행의 연한 primary-soft와 대비), 그 외는 순위 기준.
function headerBg(rank: number, isMyTeam: boolean): string {
  if (isMyTeam) return "bg-primary";
  if (rank === 1) return "bg-place-win-bg";
  if (rank <= 10) return "bg-place-top10-bg";
  return "bg-surface-subtle";
}

// 참가자 표 컬럼 정의 — 팀원 한 명 한 명의 매치 스탯을 전부 표시.
// strong=값 강조(진한 볼드), 나머지는 보조색.
const COLUMNS: {
  label: string;
  w: string;
  get: (m: MatchTeamMember) => string | number;
  strong?: boolean;
}[] = [
  { label: "킬", w: "w-9", get: (m) => m.kills, strong: true },
  { label: "어시", w: "w-9", get: (m) => m.assists },
  { label: "딜량", w: "w-14", get: (m) => m.damage, strong: true },
  { label: "헤드샷", w: "w-14", get: (m) => m.headshot },
  { label: "DBNO", w: "w-12", get: (m) => m.dbnos },
  { label: "최장킬", w: "w-14", get: (m) => `${m.longestKill}m` },
  { label: "연속킬", w: "w-12", get: (m) => m.killStreaks },
  { label: "부활", w: "w-10", get: (m) => m.revives },
  { label: "팀킬", w: "w-10", get: (m) => m.teamKills },
  { label: "생존", w: "w-14", get: (m) => m.survivalTime },
  { label: "사망", w: "w-14", get: (m) => m.deathLabel },
];

function ColumnHeader() {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-hairline bg-surface px-4 py-2.5 text-[11px] font-medium text-text-tertiary">
      <span className="w-4 shrink-0" />
      <span className="w-7 shrink-0" />
      <span className="min-w-[110px] flex-1">플레이어</span>
      {COLUMNS.map((c) => (
        <span key={c.label} className={`${c.w} shrink-0 text-center`}>
          {c.label}
        </span>
      ))}
    </div>
  );
}

function PlayerRow({ member, rank }: { member: MatchTeamMember; rank: number }) {
  const { name, isTarget } = member;
  return (
    <div
      className={`flex items-center gap-2 border-b border-hairline px-4 py-2.5 ${
        isTarget ? "bg-primary-soft" : "bg-surface"
      }`}
    >
      <span className="w-4 shrink-0 text-center text-xs font-medium text-text-tertiary">{rank}</span>
      <Avatar alt={name} size="sm" />
      <span className="flex min-w-[110px] flex-1 items-center gap-1.5 truncate">
        <span
          className={`truncate text-caption font-semibold ${
            isTarget ? "text-primary" : "text-text-primary"
          }`}
        >
          {name}
        </span>
        {isTarget && <span className="shrink-0 text-[11px] font-bold text-primary">(나)</span>}
      </span>
      {COLUMNS.map((c) => (
        <span
          key={c.label}
          className={`${c.w} shrink-0 text-center text-caption ${
            c.strong ? "font-bold text-text-primary" : "text-text-secondary"
          }`}
        >
          {c.get(member)}
        </span>
      ))}
    </div>
  );
}

function TeamGroup({ team, isMyTeam }: { team: MatchTeam; isMyTeam: boolean }) {
  const tag = placementTag(team.rank);
  return (
    <div>
      <div className={`flex items-center gap-2.5 px-4 py-2.5 ${headerBg(team.rank, isMyTeam)}`}>
        <span
          className={`rounded-sm px-1.5 py-0.5 text-xs font-bold ${
            isMyTeam ? "bg-surface text-primary" : "bg-surface/70 text-text-primary"
          }`}
        >
          #{team.rank}
        </span>
        <span
          className={`text-sm font-bold leading-none ${
            isMyTeam ? "text-surface" : "text-text-primary"
          }`}
        >
          {isMyTeam ? "우리 팀" : `팀 ${team.teamId}`}
        </span>
        {tag && (
          <span
            className={`text-xs font-semibold leading-none ${
              isMyTeam ? "text-surface/90" : tag.chip
            }`}
          >
            {tag.label}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 leading-none ${
              isMyTeam ? "bg-surface/20 text-surface" : "bg-surface text-text-secondary"
            }`}
          >
            <span className="text-[10px] font-medium opacity-80">팀 킬</span>
            <span className="text-sm font-bold">{team.totalKills}</span>
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 leading-none ${
              isMyTeam ? "bg-surface/20 text-surface" : "bg-surface text-text-secondary"
            }`}
          >
            <span className="text-[10px] font-medium opacity-80">팀 딜량</span>
            <span className="text-sm font-bold">{team.totalDamage.toLocaleString()}</span>
          </span>
        </div>
      </div>
      {team.members.map((m, i) => (
        <PlayerRow key={m.name} member={m} rank={i + 1} />
      ))}
    </div>
  );
}

const LEGEND = [
  { label: "우리 팀", dot: "bg-primary" },
  { label: "내 플레이어", dot: "bg-primary-soft ring-1 ring-primary" },
  { label: "우승", dot: "bg-place-win-fg" },
  { label: "Top 10", dot: "bg-place-top10-fg" },
];

// 참가자 표 래퍼 — 세로로 길면 표 안에서 스크롤(max-h) + 헤더 sticky 고정. 컬럼이 많아 가로로도 스크롤한다.
function RankTable({ children }: { children: ReactNode }) {
  return (
    <div className="max-h-[560px] overflow-auto rounded-lg border border-hairline">
      <div className="min-w-[900px]">
        <ColumnHeader />
        {children}
      </div>
    </div>
  );
}

// 팀 전적 — 우리 팀 요약(순위·킬합산·딜량합산·평균 이동거리) + 우리 팀원만
function TeamRecord({ team }: { team: MatchTeam }) {
  const avgMoveKm = team.members.length
    ? (team.members.reduce((s, m) => s + m.moveDistanceM, 0) / team.members.length / 1000).toFixed(2)
    : "0";

  const summary = [
    { label: "킬 합산", value: team.totalKills },
    { label: "딜량 합산", value: team.totalDamage.toLocaleString() },
    { label: "평균 이동 거리", value: `${avgMoveKm}km` },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-6 rounded-lg border-l-4 border-primary bg-surface-subtle px-5 py-4">
        <span className="text-2xl font-bold text-text-primary">#{team.rank}</span>
        {summary.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <span className="text-lg font-bold text-text-primary">{s.value}</span>
            <span className="text-[11px] font-medium text-text-tertiary">{s.label}</span>
          </div>
        ))}
      </div>

      <RankTable>
        {team.members.map((m, i) => (
          <PlayerRow key={m.name} member={m} rank={i + 1} />
        ))}
      </RankTable>
    </div>
  );
}

const TABS: { value: DetailTab; label: string }[] = [
  { value: "team", label: "팀 전적" },
  { value: "all", label: "전체 순위" },
];

export default function MatchDetail({ match, playerId, stats }: MatchDetailProps) {
  const [tab, setTab] = useState<DetailTab>("team");
  const attr = match.data.attributes;
  // 참가자 100명 Map 생성 + 로스터 정렬 + 팀별 정렬이라 탭을 누를 때마다 다시 돌 이유가 없다.
  const teams = useMemo(() => toMatchTeams(match, playerId), [match, playerId]);
  const isWin = stats.winPlace === 1;
  const mapLabel = formatMapName(attr.mapName);
  const modeLabel = gameModeFullLabel(attr.gameMode);
  const totalTeams = teams.length;
  const totalPlayers = teams.reduce((sum, t) => sum + t.members.length, 0);
  const myTeam = teams.find((t) => t.members.some((m) => m.isTarget));
  const myTeamId = myTeam?.teamId;

  return (
    <div className="rounded-lg border border-hairline bg-surface p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm font-bold text-text-primary">매치 상세</span>
        <span className="text-caption text-text-secondary">
          {mapLabel} · {modeLabel}
        </span>
        <span className="text-caption text-text-tertiary">{formatSurvival(attr.duration)} 진행</span>
      </div>

      {/* 요약 8칸 — 회색 카드 */}
      <div className="mb-6 grid grid-cols-4 gap-3 rounded-lg bg-surface-subtle p-4 sm:grid-cols-8">
        {summaryStats(stats).map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold text-text-primary">{stat.value}</span>
            <span className="text-[11px] font-medium text-text-tertiary">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div className="mb-4 flex items-center gap-1 rounded-md bg-surface-subtle p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`flex-1 rounded-sm py-2 text-sm font-semibold transition-colors ${
              tab === t.value
                ? "bg-surface text-text-primary shadow-xs"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "team" ? (
        myTeam ? (
          <TeamRecord team={myTeam} />
        ) : (
          <p className="py-8 text-center text-caption text-text-tertiary">
            우리 팀 정보를 찾을 수 없습니다
          </p>
        )
      ) : (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-caption font-medium text-text-tertiary">
              총 {totalTeams}팀 · {totalPlayers}명 참가
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {LEGEND.map((item) => (
                <span key={item.label} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-pill ${item.dot}`} />
                  <span className="text-[11px] text-text-tertiary">{item.label}</span>
                </span>
              ))}
            </div>
          </div>
          <RankTable>
            {teams.map((team) => (
              <TeamGroup key={team.teamId} team={team} isMyTeam={team.teamId === myTeamId} />
            ))}
          </RankTable>
        </div>
      )}

      {/* 순위 배너 */}
      <div
        className={`mt-6 flex items-center gap-2 rounded-lg px-4 py-3 text-caption ${
          isWin ? "bg-place-win-bg text-place-win-fg" : "bg-surface-subtle text-text-secondary"
        }`}
      >
        <Trophy aria-hidden className="h-4 w-4 shrink-0" />
        <span className="font-semibold">
          {mapLabel}에서 {isWin ? "치킨 획득!" : `#${stats.winPlace} 순위`}
        </span>
        <span className="text-text-tertiary">
          {stats.kills}킬 {Math.round(stats.damageDealt).toLocaleString()} 딜량 기록
        </span>
      </div>
    </div>
  );
}
