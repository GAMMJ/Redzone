import type { UISize } from "./types";

// PUBG API는 플레이어 아바타를 주지 않아 전 화면이 이 기본 이미지를 쓴다.
// 3레벨 헬멧 렌더(256×256, 알파 포함 webp 8KB) — 가장 큰 노출 크기가 110px(lg)라
// 2배 DPR까지 커버된다. next/image는 금지(CLAUDE.md)라 사전 압축본을 그대로 <img>로 쓴다.
const DEFAULT_AVATAR_SRC = "/images/default-profile.webp";

interface AvatarProps {
  // 생략하면 기본 프로필 이미지. 빈 문자열이면 이미지 없이 회색 원만 그린다.
  src?: string;
  alt?: string;
  size?: UISize;
  className?: string;
}

// lg(110px)는 프로필 페이지용
const SIZE: Record<UISize, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-[110px] w-[110px]",
};

// 기본 이미지는 원에 꽉 차면 답답해 안쪽 여백을 두고 축소 배치한다(각 크기의 약 11~14%).
// 실제 아바타 사진이 들어오면 여백 없이 원을 꽉 채우는 게 맞으므로 기본 이미지에만 적용.
const DEFAULT_INSET: Record<UISize, string> = {
  sm: "p-1",
  md: "p-1",
  lg: "p-3",
};

export default function Avatar({
  src = DEFAULT_AVATAR_SRC,
  alt = "",
  size = "md",
  className = "",
}: AvatarProps) {
  const isDefault = src === DEFAULT_AVATAR_SRC;

  return (
    // 래퍼가 고정 크기라 이미지 로드 전후로 레이아웃이 밀리지 않는다(CLS 방지)
    <div
      className={`shrink-0 overflow-hidden rounded-pill border border-hairline bg-surface-muted ${SIZE[size]} ${isDefault ? DEFAULT_INSET[size] : ""} ${className}`}
    >
      {/* next/image는 Vercel 무료 최적화 한도로 금지(CLAUDE.md) → 일반 img */}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`h-full w-full ${isDefault ? "object-contain" : "object-cover"}`}
        />
      )}
    </div>
  );
}
