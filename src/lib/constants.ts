import { Gamepad2, MessageCircle, Monitor } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// xbox는 platform shard `xbox`를 쓴다. `console`은 PUBG 문서상 /matches·/samples 전용이라
// 플레이어 조회에 쓰면 실존 계정도 404가 난다(docs/local/findings/pubg-shards.md 실측).
// psn은 이름으로도 계정 id로도 플레이어를 못 받아 아직 넣지 않는다.
export const PLATFORMS = ["steam", "kakao", "xbox"] as const;
export type Platform = (typeof PLATFORMS)[number];

// 문자열이 지원 플랫폼인지 검사하는 타입 가드
export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  steam: "Steam",
  kakao: "Kakao",
  xbox: "Xbox",
};

export const PLATFORM_ICON: Record<Platform, LucideIcon> = {
  steam: Monitor,
  kakao: MessageCircle,
  xbox: Gamepad2,
};

export const GAME_MODES = ["solo", "solo-fpp", "duo", "duo-fpp", "squad", "squad-fpp"] as const;
export type GameMode = (typeof GAME_MODES)[number];
