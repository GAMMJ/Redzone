"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import dayjs from "@/lib/dayjs";
import Button from "@/components/ui/Button";
import {
  formatMapName,
  gameModeBaseLabel,
  gameModePerspective,
  type PlacementVariant,
} from "@/lib/pubg/matchLabels";

const VARIANT: Record<PlacementVariant, { accent: string; bg: string; fg: string; label: string }> =
  {
    win: { accent: "bg-place-win-fg", bg: "bg-place-win-bg", fg: "text-place-win-fg", label: "WIN" },
    top10: {
      accent: "bg-place-top10-fg",
      bg: "bg-place-top10-bg",
      fg: "text-place-top10-fg",
      label: "TOP 10",
    },
    // 11등 이하 — 색 없는 중립 카드 (라벨 없음)
    default: {
      accent: "bg-hairline-strong",
      bg: "bg-surface-subtle",
      fg: "text-text-secondary",
      label: "",
    },
  };

interface MatchCardBaseProps {
  placement: number;
  // 총 팀 수 — 있으면 "#등수 / 팀수" 형태로 표시
  totalTeams?: number;
  placementVariant: PlacementVariant;
  gameMode: string;
  mapName: string;
  kills: number | string;
  assists: number | string;
  damage: number | string;
  headshot: number | string;
  survivalTime: string;
  playedAt: string | Date;
  // 게임모드 라벨 앞에 붙는 구분 접두어 — "경쟁전"/"일반전"/"캐주얼" (예: "경쟁전 스쿼드")
  modePrefix?: string;
  // 확장 시 렌더할 상세. 지연 조회를 위해 값이 아니라 함수로 받는다(펼칠 때만 호출).
  expandedContent?: () => ReactNode;
}

/**
 * 펼침을 누가 쥐는가.
 *
 * 부모가 쥐면 남의 프로필에 다녀와도 자리를 되살릴 수 있다 — 카드는 언마운트되며 잊는다.
 * 주지 않으면 예전처럼 카드가 스스로 든다.
 *
 * 둘을 쌍으로 묶는 이유는, `expanded`만 주고 `onToggle`을 빠뜨리면 눌러도 아무 일도
 * 일어나지 않는 버튼이 되기 때문이다. 부모가 준 값이 계속 이겨서 조용히 죽는다.
 */
type ExpandControl =
  | { expanded: boolean; onToggle: () => void }
  | { expanded?: undefined; onToggle?: undefined };

type MatchCardProps = MatchCardBaseProps & ExpandControl;

export default function MatchCard({
  placement,
  totalTeams,
  placementVariant,
  gameMode,
  mapName,
  kills,
  assists,
  damage,
  headshot,
  survivalTime,
  playedAt,
  modePrefix,
  expandedContent,
  expanded: expandedProp,
  onToggle,
}: MatchCardProps) {
  // 부모가 쥐지 않으면 예전처럼 스스로 든다 — 다른 화면에서 그냥 쓸 수 있게 남긴다.
  const [selfExpanded, setSelfExpanded] = useState(false);
  const expanded = expandedProp ?? selfExpanded;
  const toggle = onToggle ?? (() => setSelfExpanded((prev) => !prev));
  const variant = VARIANT[placementVariant];
  const canExpand = Boolean(expandedContent);

  const stats = [
    { label: "킬", value: kills },
    { label: "어시스트", value: assists },
    { label: "딜량", value: damage },
    { label: "헤드샷", value: headshot },
    { label: "생존", value: survivalTime },
  ];

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-sm">
        <div className="flex h-26 items-center">
          <div className={`h-full w-[5px] ${variant.accent}`} />

          <div
            className={`flex h-full w-[152px] flex-col justify-center gap-1 px-[22px] ${variant.bg}`}
          >
            <span className={`flex items-baseline gap-1 ${variant.fg}`}>
              <span className="text-2xl font-bold">#{placement}</span>
              {totalTeams != null && totalTeams > 0 && (
                <span className="text-sm font-semibold opacity-70">/ {totalTeams}</span>
              )}
            </span>
            {variant.label && (
              <span className={`text-[11px] font-bold tracking-[0.5px] ${variant.fg}`}>
                {variant.label}
              </span>
            )}
          </div>

          <div className="flex w-[168px] flex-col justify-center gap-2 px-[22px]">
            <span className="inline-flex w-fit items-center rounded-pill bg-surface-muted px-2.5 py-1">
              <span className="whitespace-nowrap text-xs font-semibold text-text-secondary">
                {modePrefix ? `${modePrefix} ` : ""}
                {gameModeBaseLabel(gameMode)}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden className="h-[13px] w-[13px] text-text-tertiary" />
              <span className="text-caption text-text-secondary">
                {formatMapName(mapName)} · {gameModePerspective(gameMode)}
              </span>
            </span>
          </div>

          {/* 스탯은 고정폭(w-14) 컬럼을 왼쪽으로 밀착 — 값 길이(0 vs 842)와 무관하게 카드 간 세로 정렬 */}
          <div className="flex flex-1 items-center gap-3 px-[22px]">
            {stats.map((stat) => (
              <div key={stat.label} className="flex w-14 flex-col items-center gap-[3px]">
                <span className="text-base font-bold text-text-primary">{stat.value}</span>
                <span className="whitespace-nowrap text-[11px] font-medium text-text-tertiary">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex h-full w-40 flex-col items-end justify-center gap-3 px-[22px]">
            {/* 상대 시각이라 서버 렌더 시각과 hydration 시각이 다르면 문자열이 어긋난다.
                분·시간 경계에 걸릴 때만 생기므로 경고만 억제하고 값은 그대로 쓴다. */}
            <span suppressHydrationWarning className="text-caption text-text-tertiary">
              {dayjs(playedAt).fromNow()}
            </span>
            {canExpand && (
              <Button
                variant="secondary"
                size="sm"
                aria-expanded={expanded}
                onClick={toggle}
              >
                상세보기
                <ChevronDown
                  aria-hidden
                  className={`h-[15px] w-[15px] transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 상세는 매치 행 카드 아래에 별도 카드로 살짝 띄워서 표시 (펼칠 때만 조회) */}
      {expanded && expandedContent && <div className="mt-3">{expandedContent()}</div>}
    </div>
  );
}
