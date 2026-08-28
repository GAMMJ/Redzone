"use client";

import { useMemo, useState } from "react";
import MatchMap, { type MapMarker } from "@/components/player/MatchMap";
import type { MatchTelemetry, TelemetryPoint } from "@/types/telemetry";

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
  /** 지도에 찍을 위치. 킬에만 있다. */
  at2d?: TelemetryPoint | null;
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

/**
 * 시각이 같을 때의 앞뒤. 기절 → (부활 | 킬) 순이다.
 *
 * 부활은 눕혀진 사람에게만 일어나고, 킬도 눕힌 뒤에 마무리하는 것이라 둘 다 기절 뒤다.
 * 부활과 킬은 같은 사람에게 동시에 일어날 수 없어 서로의 앞뒤는 뜻이 없다.
 */
const CAUSAL_ORDER: Record<LogEntry["kind"], number> = { groggy: 0, revive: 1, kill: 2 };

// at은 정렬을 위해 소수점을 갖는다(telemetry.ts의 secondsFrom 참고). 표시할 때는 버린다.
function formatClock(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

interface MatchLogProps {
  telemetry: MatchTelemetry;
  /** 지도 이미지를 고르는 데 쓴다 */
  mapName: string;
  /** 이 프로필의 플레이어 이름. "나" 필터 기준이다. */
  playerName: string;
  /** 우리 팀 전원의 이름. "우리 팀" 필터 기준이다. */
  teamNames: string[];
}

export default function MatchLog({ telemetry, mapName, playerName, teamNames }: MatchLogProps) {
  // 기본은 전체 유형 + 우리 팀.
  //
  // 이 탭을 여는 이유는 대개 "우리 판이 어떻게 흘러갔나"라서 남의 팀 교전부터 보일 이유가 없다.
  // 우리 팀으로 좁히면 목록이 짧아지므로 기절·부활까지 다 켜도 한눈에 읽힌다
  // (모든 플레이어에서 전체 유형을 켜면 기절이 킬과 거의 겹쳐 목록이 두 배가 된다).
  const [kind, setKind] = useState<KindFilter>("all");
  const [scope, setScope] = useState<ScopeFilter>("team");
  // 지도 마커와 타임라인 항목이 서로를 가리킨다.
  // 같은 항목을 다시 누르면 해제된다 — 지도의 "전체 보기"도 이 경로를 쓴다.
  const [activeId, setActiveId] = useState<string | null>(null);
  const toggleActive = (id: string) => setActiveId((prev) => (prev === id ? null : id));

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
        // 가해자 위치를 우선한다 — "어디서 쐈나"가 "어디서 죽었나"보다 읽기 쉽다.
        // 자기장·낙사는 가해자가 없어 피해자 위치로 떨어진다.
        at2d: k.killerAt ?? k.victimAt,
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
    // 시각이 같으면 인과 순서로 가른다. 눕힌 다음에 마무리하므로 기절이 먼저다.
    //
    // 소수점을 남긴 뒤에는 같은 값이 나오는 일이 거의 없지만, 캐시에 남아 있는 옛 요약은
    // 초 단위로 반올림돼 있어 여전히 겹친다. 그리고 sort는 안정 정렬이라 값이 같으면
    // 넣은 순서(킬 → 기절 → 부활)가 그대로 남아, 하필 킬이 위로 간다.
    return merged.sort((a, b) => a.at - b.at || CAUSAL_ORDER[a.kind] - CAUSAL_ORDER[b.kind]);
  }, [telemetry]);

  const team = useMemo(() => new Set(teamNames), [teamNames]);

  const visible = entries.filter((e) => {
    if (kind !== "all" && e.kind !== kind) return false;
    if (scope === "me") return e.actor === playerName || e.target === playerName;
    if (scope === "team") return (e.actor !== null && team.has(e.actor)) || team.has(e.target);
    return true;
  });

  // 지도에 찍을 것은 좌표가 있는 항목뿐이고, 번호는 그 마커와 목록을 잇는 용도다.
  // 좌표가 없는 기절·부활에는 번호를 주지 않는다 — 주면 다음 마커의 번호를 미리 쓰게 돼
  // 같은 번호가 여러 줄에 찍힌다.
  const markerOrder = new Map<string, number>();
  const markers: MapMarker[] = [];
  for (const entry of visible) {
    if (!entry.at2d) continue;
    markers.push({
      id: entry.id,
      order: markers.length + 1,
      at: entry.at2d,
      mine: entry.actor === playerName,
    });
    markerOrder.set(entry.id, markers.length);
  }

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
              onClick={() => {
                setKind(f.value);
                setActiveId(null);
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          {scopeFilters.map((f) => (
            <FilterButton
              key={f.value}
              label={f.label}
              active={scope === f.value}
              onClick={() => {
                setScope(f.value);
                setActiveId(null);
              }}
            />
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-hairline py-10 text-center text-caption text-text-tertiary">
          해당하는 기록이 없습니다
        </p>
      ) : (
        // 좁은 화면에서는 지도가 위, 목록이 아래로 쌓인다
        <div className="grid gap-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <MatchMap
            mapName={mapName}
            markers={markers}
            activeId={activeId}
            onSelect={toggleActive}
          />

          <div className="flex flex-col gap-2">
            <div className="max-h-[560px] overflow-y-auto rounded-lg border border-hairline">
              {visible.map((entry) => (
                <LogRow
                  key={entry.id}
                  entry={entry}
                  order={markerOrder.get(entry.id) ?? null}
                  playerName={playerName}
                  active={entry.id === activeId}
                  onSelect={toggleActive}
                />
              ))}
            </div>
            <p className="text-right text-[11px] text-text-tertiary">{visible.length}건</p>
          </div>
        </div>
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

function LogRow({
  entry,
  order,
  playerName,
  active,
  onSelect,
}: {
  entry: LogEntry;
  order: number | null;
  playerName: string;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const mine = entry.actor === playerName || entry.target === playerName;
  const part = entry.bodyPart ? BODY_PART[entry.bodyPart] : undefined;

  return (
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      aria-pressed={active}
      // 목록이 수백 건까지 가므로 화면 밖 행은 렌더 비용을 줄인다.
      //
      // 오른쪽 세 칸(무기·거리·부위)은 값이 없어도 자리를 비워 둔다.
      // 조건부로 빼면 부위 없는 행에서 무기와 거리가 오른쪽으로 밀려 열이 어긋난다.
      // flex-wrap도 쓰지 않는다 — 줄이 접히면 정렬이 무너진다.
      className={`flex w-full items-center gap-x-3 border-b border-hairline px-4 py-2.5 text-left text-caption transition-colors [content-visibility:auto] last:border-0 ${
        active ? "bg-primary/15" : mine ? "bg-primary-soft" : "bg-surface hover:bg-surface-subtle"
      }`}
    >
      {/* 지도 마커에 찍힌 번호와 같은 값이다. 좌표가 없는 항목은 비워 두되 칸은 남긴다 */}
      <span className="w-6 shrink-0 text-right text-[11px] text-text-tertiary">{order}</span>
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
    </button>
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
