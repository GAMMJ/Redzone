import { Gamepad2, MessageCircle, Monitor } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const PLATFORMS = ["steam", "kakao", "console"] as const;
export type Platform = (typeof PLATFORMS)[number];

// 문자열이 지원 플랫폼인지 검사하는 타입 가드
export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  steam: "Steam",
  kakao: "카카오",
  console: "콘솔",
};

export const PLATFORM_ICON: Record<Platform, LucideIcon> = {
  steam: Monitor,
  kakao: MessageCircle,
  console: Gamepad2,
};

export const GAME_MODES = ["solo", "solo-fpp", "duo", "duo-fpp", "squad", "squad-fpp"] as const;
export type GameMode = (typeof GAME_MODES)[number];
