import type { Platform, GameMode } from "@/lib/constants";

// 랭킹 페이지가 지원하는 플랫폼은 리더보드가 존재하는 값으로 좁힌다(steam·kakao PC).
export type RankingPlatform = Extract<Platform, "steam" | "kakao">;

export interface RankingOption<T> {
  value: T;
  label: string;
}

export const RANKING_PLATFORMS: RankingOption<RankingPlatform>[] = [
  { value: "steam", label: "Steam" },
  { value: "kakao", label: "Kakao" },
];

export const DEFAULT_RANKING_PLATFORM: RankingPlatform = "steam";

// 랭킹 페이지 표시 인원 — 페이지네이션 없이 상위 N명 고정.
// 조회·메타데이터·화면 문구가 모두 이 값을 참조해야 숫자가 서로 어긋나지 않는다.
export const RANKING_LIMIT = 100;

// 경쟁전 리더보드는 모드를 나눠 불러도 레이팅·스탯이 동일하게 내려와서 모드 토글을 두지 않는다.
// 조회용 gameMode는 스쿼드 3인칭으로 고정.
export const RANKING_GAME_MODE: GameMode = "squad";

// searchParams 화이트리스트 검증 — 미지원 값이면 기본값으로 폴백
export function parseRankingPlatform(value: string | undefined): RankingPlatform {
  const matched = RANKING_PLATFORMS.find((option) => option.value === value);
  return matched?.value ?? DEFAULT_RANKING_PLATFORM;
}
