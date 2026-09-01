import { Gamepad2, MessageCircle, Monitor } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// 콘솔은 xbox·psn platform shard로 나눠 받는다. `console` shard는 PUBG 문서상
// /matches·/samples 전용이라 플레이어 조회에 쓰면 실존 계정도 404가 난다
// (docs/local/findings/pubg-shards.md 실측).
export const PLATFORMS = ["steam", "kakao", "xbox", "psn"] as const;
export type Platform = (typeof PLATFORMS)[number];

// 문자열이 지원 플랫폼인지 검사하는 타입 가드
export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

/**
 * 시즌 id를 공유하는 PC 플랫폼.
 *
 * PUBG는 PC와 콘솔에 서로 다른 시즌 id를 준다(`division.bro.official.pc-2018-42` vs
 * `...console-42`). 그래서 시즌을 한 번 조회해 여러 카드에 나눠 주는 자리는 **같은 계열끼리만**
 * 묶을 수 있다. 콘솔을 그 자리에 끼우면 PC 시즌 id로 콘솔 리더보드를 부르게 되고,
 * 그 조합은 응답이 없다 — 화면에는 "랭킹 없음"으로만 보인다.
 *
 * 홈이 정확히 그 구조라(시즌 1회 조회 → 카드 둘) 그쪽 props를 이 타입으로 좁혀 둔다.
 * 콘솔을 붙이려면 시즌을 따로 받아야 하고, 그때 이 타입이 먼저 막아선다.
 */
export type PcPlatform = Extract<Platform, "steam" | "kakao">;

export const PLATFORM_LABEL: Record<Platform, string> = {
  steam: "Steam",
  kakao: "Kakao",
  xbox: "Xbox",
  psn: "PSN",
};

export const PLATFORM_ICON: Record<Platform, LucideIcon> = {
  steam: Monitor,
  kakao: MessageCircle,
  xbox: Gamepad2,
  psn: Gamepad2,
};

export const GAME_MODES = ["solo", "solo-fpp", "duo", "duo-fpp", "squad", "squad-fpp"] as const;
export type GameMode = (typeof GAME_MODES)[number];
