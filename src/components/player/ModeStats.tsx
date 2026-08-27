"use client";

import { useState } from "react";
import Dropdown from "@/components/ui/Dropdown";
import TierLabel from "@/components/ui/TierLabel";
import SectionHeading from "./SectionHeading";
import ModeStatCard from "./ModeStatCard";
import LoadFailure from "@/components/ui/LoadFailure";
import {
  buildRankedStats,
  buildSeasonStats,
  rankedSummary,
  seasonSummary,
} from "./statBuilders";
import type { GameMode } from "@/lib/constants";
import type { RankedGameModeStats, SeasonStats } from "@/types/player";

type Perspective = "tpp" | "fpp";

// 나란히 비교할 모드 3종 (base는 게임모드 키 조합용, accent는 카드 상단 색 띠)
const MODES = [
  { base: "solo", label: "솔로", accent: "border-t-[3px] border-t-info" },
  { base: "duo", label: "듀오", accent: "border-t-[3px] border-t-success" },
  { base: "squad", label: "스쿼드", accent: "border-t-[3px] border-t-primary" },
] as const;

const PERSPECTIVE_OPTIONS = [
  { value: "tpp", label: "TPP" },
  { value: "fpp", label: "FPP" },
] as const;

interface ModeStatsProps {
  /**
   * 현재 시즌 랭크·일반 스탯(모드별). TPP/FPP 두 시점이 모두 담겨 있어 클라에서 슬라이스만 한다.
   *
   * 빈 값이 두 가지를 뜻하므로 `failed`를 함께 받는다. 실제로 안 한 것과 못 불러온 것을
   * 같은 화면으로 보여 주면, 랭크를 돌린 사람에게 "이번 시즌 기록 없음"이라고 단정하게 된다.
   */
  ranked: Partial<Record<GameMode, RankedGameModeStats>>;
  season: Partial<Record<GameMode, SeasonStats>>;
  rankedFailed?: boolean;
  seasonFailed?: boolean;
}

// 경쟁전 카드 부제 — 티어 + RP
function TierSubtitle({ ranked }: { ranked: RankedGameModeStats }) {
  const tier = ranked.currentTier;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <TierLabel tier={tier.tier} subTier={tier.subTier} className="font-semibold text-text-primary" />
      <span className="font-mono font-bold text-primary">
        {ranked.currentRankPoint.toLocaleString()} RP
      </span>
    </span>
  );
}

export default function ModeStats({
  ranked,
  season,
  rankedFailed = false,
  seasonFailed = false,
}: ModeStatsProps) {
  const [perspective, setPerspective] = useState<Perspective>("tpp");
  // TPP는 기본 키(squad), FPP는 -fpp 접미사
  const perspectiveSuffix = perspective === "fpp" ? "-fpp" : "";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading>모드별 시즌 스탯</SectionHeading>
        <Dropdown<Perspective>
          options={[...PERSPECTIVE_OPTIONS]}
          value={perspective}
          onChange={setPerspective}
          size="sm"
          showCheck={false}
        />
      </div>

      {/* 경쟁전 */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text-secondary">경쟁전 시즌 스탯</h3>
        {rankedFailed ? (
          // 카드 셋에 각각 "못 불러옴"을 띄우면 같은 말이 세 번이고 재시도 버튼도 셋이 된다.
          // 못 불러온 것은 이 구역 전체이므로 한 번만 말한다.
          <div className="rounded-lg border border-hairline bg-surface">
            <LoadFailure message="경쟁전 시즌 스탯을 불러오지 못했습니다." />
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {MODES.map((mode) => {
            const modeKey = `${mode.base}${perspectiveSuffix}` as GameMode;
            const stat = ranked[modeKey];
            const hasStat = !!stat && stat.roundsPlayed > 0;
            return (
              <ModeStatCard
                key={mode.base}
                label={mode.label}
                accentClass={mode.accent}
                summary={hasStat ? rankedSummary(stat) : undefined}
                middle={hasStat ? <TierSubtitle ranked={stat} /> : undefined}
                stats={hasStat ? buildRankedStats(stat) : undefined}
                emptyText="이번 시즌 경쟁전 기록 없음"
              />
            );
          })}
        </div>
        )}
      </section>

      {/* 일반전 */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text-secondary">일반전 시즌 스탯</h3>
        {seasonFailed ? (
          <div className="rounded-lg border border-hairline bg-surface">
            <LoadFailure message="일반전 시즌 스탯을 불러오지 못했습니다." />
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {MODES.map((mode) => {
            const modeKey = `${mode.base}${perspectiveSuffix}` as GameMode;
            const stat = season[modeKey];
            const hasStat = !!stat && stat.roundsPlayed > 0;
            return (
              <ModeStatCard
                key={mode.base}
                label={mode.label}
                accentClass={mode.accent}
                summary={hasStat ? seasonSummary(stat) : undefined}
                stats={hasStat ? buildSeasonStats(stat) : undefined}
                emptyText="이번 시즌 일반전 기록 없음"
              />
            );
          })}
        </div>
        )}
      </section>
    </section>
  );
}
