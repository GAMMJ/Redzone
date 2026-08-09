// 시즌 스탯 카드용 값 빌더 — 경쟁전(ranked) / 일반전(season) 각각 8칸 + 상단 요약(승/탑/패)
import type { RankedGameModeStats, SeasonStats } from "@/types/player";
import type { StatItem, ModeSummary } from "./ModeStatCard";

// 퍼센트 표기 — 소수 1자리, 딱 떨어지면 정수로(10% / 10.4% / 0%)
function fmtPct(percent: number): string {
  return `${Math.round(percent * 10) / 10}%`;
}

// 비율(0~1) → "%" (랭크 응답은 비율로 옴)
function ratioPct(ratio: number): string {
  return fmtPct(ratio * 100);
}

// part/whole → "%" (일반전은 판수 기반이라 직접 나눔). 분모 0이면 0%.
function pct(part: number, whole: number): string {
  if (!whole) return "0%";
  return fmtPct((part / whole) * 100);
}

// 상단 요약 — 경쟁전: top10은 비율뿐이라 판수로 환산, 패는 판수-승
export function rankedSummary(ranked: RankedGameModeStats): ModeSummary {
  const rounds = ranked.roundsPlayed;
  return {
    wins: ranked.wins,
    top: Math.round(ranked.top10Ratio * rounds),
    losses: Math.max(rounds - ranked.wins, 0),
  };
}

// 상단 요약 — 일반전: 승·탑10·패가 그대로 있음
export function seasonSummary(season: SeasonStats): ModeSummary {
  return { wins: season.wins, top: season.top10s, losses: season.losses };
}

// 경쟁전(랭크) 8칸
export function buildRankedStats(ranked: RankedGameModeStats): StatItem[] {
  const rounds = ranked.roundsPlayed;
  // kda/kdr은 0으로 와서 kills/deaths로 직접 계산
  const kd = ranked.deaths > 0 ? ranked.kills / ranked.deaths : ranked.kills;
  const avgDamage = rounds ? Math.round(ranked.damageDealt / rounds) : 0;

  return [
    { label: "K/D", value: kd.toFixed(2) },
    { label: "승률", value: ratioPct(ranked.winRatio) },
    { label: "평균 딜량", value: avgDamage },
    { label: "최고 RP", value: ranked.bestRankPoint.toLocaleString() },
    { label: "매치 수", value: rounds.toLocaleString() },
    { label: "Top 10", value: ratioPct(ranked.top10Ratio) },
    { label: "평균 순위", value: `#${Math.round(ranked.avgRank)}` },
    { label: "매치당 평균 킬", value: ranked.avgKill.toFixed(1) },
  ];
}

// 일반전(시즌) 8칸 — 티어/RP·평균순위가 없어 그 대신 헤드샷·최장 킬로 채운다
export function buildSeasonStats(season: SeasonStats): StatItem[] {
  const rounds = season.roundsPlayed;
  // 일반전 응답엔 deaths가 없어 losses(비승리 판수 ≈ 사망 수)를 K/D 분모로 대용
  const kd = season.losses > 0 ? season.kills / season.losses : season.kills;

  return [
    { label: "K/D", value: kd.toFixed(2) },
    { label: "승률", value: pct(season.wins, rounds) },
    { label: "평균 딜량", value: rounds ? Math.round(season.damageDealt / rounds) : 0 },
    // 일반전 응답엔 헤드샷 비율이 없어 headshotKills/kills로 계산
    { label: "헤드샷", value: pct(season.headshotKills, season.kills) },
    { label: "매치 수", value: rounds.toLocaleString() },
    { label: "Top 10", value: pct(season.top10s, rounds) },
    { label: "최장 킬", value: `${Math.round(season.longestKill)}m` },
    { label: "매치당 평균 킬", value: rounds ? (season.kills / rounds).toFixed(1) : "0" },
  ];
}
