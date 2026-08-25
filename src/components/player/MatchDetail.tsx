"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Trophy } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { formatMapName, formatSurvival, gameModeFullLabel } from "@/lib/pubg/matchLabels";
import { mainWeaponOf } from "@/lib/pubg/telemetry";
import { toMatchTeams } from "@/lib/pubg/matchTeams";
import type { MatchTeam, MatchTeamMember } from "@/lib/pubg/matchTeams";
import type { MatchResponse, ParticipantStats } from "@/types/match";
import type { MatchTelemetry } from "@/types/telemetry";

interface MatchDetailProps {
  match: MatchResponse;
  playerId: string;
  stats: ParticipantStats;
  /** 텔레메트리 요약. 아직 안 왔거나 실패하면 undefined — 그 칸만 비운다. */
  telemetry?: MatchTelemetry;
}

type DetailTab = "team" | "all";

// 상단 요약 — 매치 API stats에 텔레메트리에서만 나오는 둘(주무기·받은 피해)을 더한다.
// 텔레메트리가 없으면 그 두 칸만 "—"로 두고 나머지는 그대로 그린다.
function summaryStats(
  s: ParticipantStats,
  telemetry: MatchTelemetry | undefined,
  playerName: string,
): { label: string; value: string | number }[] {
  const moveKm = ((s.walkDistance + s.rideDistance + s.swimDistance) / 1000).toFixed(1);
  const mainWeapon = telemetry ? mainWeaponOf(telemetry, playerName) : null;
  const taken = telemetry?.damageTakenByPlayer[playerName];

  return [
    { label: "주 무기", value: mainWeapon ?? "—" },
    { label: "킬", value: s.kills },
    { label: "어시스트", value: s.assists },
    { label: "딜량", value: Math.round(s.damageDealt) },
    { label: "받은 피해", value: typeof taken === "number" ? taken : "—" },
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
      <span className="w-4 shrink-0 text-center text-xs font-medium text-text-tertiary">
        <span className="sr-only">팀 내 </span>
        {rank}
      </span>
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
          {/* 수치만 있으면 스크린리더에 "3 0 412 1 …"로 읽힌다.
              어떤 지표인지 숨김 텍스트로 붙여 "킬 3"으로 읽히게 한다.
              generic span의 aria-label은 무시될 수 있어 실제 텍스트를 넣는다. */}
          <span className="sr-only">{c.label} </span>
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
    // 스크롤되는 영역은 초점을 받을 수 있어야 키보드로 움직일 수 있다.
    // region + 이름이 있어야 스크린리더가 "참가자 기록 영역"으로 안내한다.
    <div
      role="region"
      aria-label="참가자 기록"
      tabIndex={0}
      className="max-h-[560px] overflow-auto rounded-lg border border-hairline"
    >
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

export default function MatchDetail({ match, playerId, stats, telemetry }: MatchDetailProps) {
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

{/* 요약 10칸 — 회색 카드. 주 무기는 글자라 다른 칸보다 작게 잡는다. */}
      <div className="mb-6 grid grid-cols-4 gap-3 rounded-lg bg-surface-subtle p-4 sm:grid-cols-5 lg:grid-cols-10">
        {summaryStats(stats, telemetry, stats.name).map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1">
            <span
              className={`font-bold text-text-primary ${
                typeof stat.value === "string" && stat.value.length > 5 ? "text-caption" : "text-lg"
              }`}
            >
              {stat.value}
            </span>
            <span className="whitespace-nowrap text-[11px] font-medium text-text-tertiary">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div className="mb-4 flex items-center gap-1 rounded-md bg-surface-subtle p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            // role="tab"을 쓰면 화살표 키 이동까지 갖춰야 한다(APG). 여기선 버튼 두 개뿐이라
            // 토글 버튼 패턴(aria-pressed)으로 선택 상태만 정확히 전달한다.
            aria-pressed={tab === t.value}
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
                  <span aria-hidden className={`h-2.5 w-2.5 rounded-pill ${item.dot}`} />
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
