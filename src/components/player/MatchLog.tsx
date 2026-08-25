"use client";

import { useMemo, useState } from "react";
import type { MatchTelemetry } from "@/types/telemetry";

// 사망 부위. 텔레메트리 값이 그대로 오므로 화면용 한글로 바꾼다.
// NonSpecific·None은 자기장·낙사처럼 부위를 특정할 수 없는 죽음이라 표시하지 않는다.
const BODY_PART: Record<string, string> = {
  HeadShot: "헤드샷",
  TorsoShot: "몸통",
  ArmShot: "팔",
  LegShot: "다리",
  PelvisShot: "골반",
};

type LogKind = "kill" | "groggy" | "revive";

interface LogEntry {
  id: string;
  /** 매치 시작 기준 경과 초 */
  at: number;
  kind: LogKind;
  /** 자기장·낙사처럼 가해자가 없는 죽음이면 null */
  actor: string | null;
  target: string;
  /** 무기 또는 사망 원인. 부활은 없다. */
  cause?: string;
  /** 0이면 표시하지 않는다 — 가해자 없는 죽음은 거리가 없다 */
  distanceM?: number;
  bodyPart?: string;
}

const KIND_LABEL: Record<LogKind, string> = {
  kill: "킬",
  groggy: "기절",
  revive: "부활",
};

// 유형별 색. 킬만 강조하고 나머지는 눌러둔다 — 전부 칠하면 구분이 사라진다.
const KIND_STYLE: Record<LogKind, string> = {
  kill: "bg-red-soft text-danger",
  groggy: "bg-surface-muted text-text-secondary",
  revive: "bg-green-soft text-success",
};

type KindFilter = "all" | LogKind;
type ScopeFilter = "all" | "team" | "me";

const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "kill", label: "킬" },
  { value: "groggy", label: "기절" },
  { value: "revive", label: "부활" },
];

function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

interface MatchLogProps {
  telemetry: MatchTelemetry;
  /** 이 프로필의 플레이어 이름. "나" 필터 기준이다. */
  playerName: string;
  /** 우리 팀 전원의 이름. "우리 팀" 필터 기준이다. */
  teamNames: string[];
}

export default function MatchLog({ telemetry, playerName, teamNames }: MatchLogProps) {
  // 기본은 킬 + 모든 플레이어. 전체 유형을 다 뿌리면 기절이 킬과 거의 중복이라 목록이 두 배가 된다.
  const [kind, setKind] = useState<KindFilter>("kill");
  const [scope, setScope] = useState<ScopeFilter>("all");

  const entries = useMemo<LogEntry[]>(() => {
    const merged: LogEntry[] = [
      ...telemetry.kills.map((k, i) => ({
        id: `k${i}`,
        at: k.at,
        kind: "kill" as const,
        actor: k.killer,
        target: k.victim,
        cause: k.weapon,
        distanceM: k.distanceM,
        bodyPart: k.bodyPart,
      })),
      ...telemetry.groggy.map((g, i) => ({
        id: `g${i}`,
        at: g.at,
        kind: "groggy" as const,
        actor: g.attacker,
        target: g.victim,
        cause: g.weapon,
        distanceM: g.distanceM,
        bodyPart: g.bodyPart,
      })),
      ...telemetry.revives.map((r, i) => ({
        id: `r${i}`,
        at: r.at,
        kind: "revive" as const,
        actor: r.reviver,
        target: r.victim,
      })),
    ];
    return merged.sort((a, b) => a.at - b.at);
  }, [telemetry]);

  const team = useMemo(() => new Set(teamNames), [teamNames]);

  const visible = entries.filter((e) => {
    if (kind !== "all" && e.kind !== kind) return false;
    if (scope === "me") return e.actor === playerName || e.target === playerName;
    if (scope === "team") return (e.actor !== null && team.has(e.actor)) || team.has(e.target);
    return true;
  });

  const scopeFilters: { value: ScopeFilter; label: string }[] = [
    { value: "all", label: "모든 플레이어" },
    { value: "team", label: "우리 팀" },
    { value: "me", label: playerName },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* 필터 두 축 — 유형(왼쪽)과 범위(오른쪽) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {KIND_FILTERS.map((f) => (
            <FilterButton
              key={f.value}
              label={f.label}
              active={kind === f.value}
              onClick={() => setKind(f.value)}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          {scopeFilters.map((f) => (
            <FilterButton
              key={f.value}
              label={f.label}
              active={scope === f.value}
              onClick={() => setScope(f.value)}
            />
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-hairline py-10 text-center text-caption text-text-tertiary">
          해당하는 기록이 없습니다
        </p>
      ) : (
        <>
          <div className="max-h-[560px] overflow-y-auto rounded-lg border border-hairline">
            {visible.map((entry) => (
              <LogRow key={entry.id} entry={entry} playerName={playerName} />
            ))}
          </div>
          <p className="text-right text-[11px] text-text-tertiary">{visible.length}건</p>
        </>
      )}
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      // 탭과 같은 이유로 role 없이 aria-pressed만 쓴다(FEAT-033 회고 참고).
      aria-pressed={active}
      onClick={onClick}
      className={`max-w-[140px] truncate rounded-sm px-2.5 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-surface-subtle text-text-secondary hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}

function LogRow({ entry, playerName }: { entry: LogEntry; playerName: string }) {
  const mine = entry.actor === playerName || entry.target === playerName;
  const part = entry.bodyPart ? BODY_PART[entry.bodyPart] : undefined;

  return (
    <div
      // 목록이 수백 건까지 가므로 화면 밖 행은 렌더 비용을 줄인다.
      //
      // 오른쪽 세 칸(무기·거리·부위)은 값이 없어도 자리를 비워 둔다.
      // 조건부로 빼면 부위 없는 행에서 무기와 거리가 오른쪽으로 밀려 열이 어긋난다.
      // flex-wrap도 쓰지 않는다 — 줄이 접히면 정렬이 무너진다.
      className={`flex items-center gap-x-3 border-b border-hairline px-4 py-2.5 text-caption [content-visibility:auto] last:border-0 ${
        mine ? "bg-primary-soft" : "bg-surface"
      }`}
    >
      <span className="w-11 shrink-0 text-text-tertiary">{formatClock(entry.at)}</span>

      <span
        className={`w-9 shrink-0 rounded-sm py-0.5 text-center text-[11px] font-bold ${KIND_STYLE[entry.kind]}`}
      >
        {KIND_LABEL[entry.kind]}
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <Name value={entry.actor} playerName={playerName} />
        <span aria-hidden className="shrink-0 text-text-tertiary">
          →
        </span>
        <Name value={entry.target} playerName={playerName} />
      </span>

      <span className="w-28 shrink-0 truncate text-right font-medium text-text-secondary">
        {entry.cause ?? ""}
      </span>
      {/* 거리 0은 가해자가 없는 죽음(자기장·낙사)이라 표시할 값이 없다 */}
      <span className="w-14 shrink-0 text-right text-text-tertiary">
        {entry.distanceM ? `${entry.distanceM}m` : ""}
      </span>
      <span className="w-12 shrink-0 text-right text-text-tertiary">{part ?? ""}</span>
    </div>
  );
}

function Name({ value, playerName }: { value: string | null; playerName: string }) {
  if (value === null) {
    return <span className="shrink-0 text-text-tertiary">—</span>;
  }
  const isMe = value === playerName;
  return (
    <span className={`truncate ${isMe ? "font-bold text-primary" : "text-text-primary"}`}>
      {value}
    </span>
  );
}
