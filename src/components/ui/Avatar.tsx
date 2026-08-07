import type { UISize } from "./types";

interface AvatarProps {
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

export default function Avatar({ src, alt = "", size = "md", className = "" }: AvatarProps) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-pill border border-hairline bg-surface-muted ${SIZE[size]} ${className}`}
    >
      {/* next/image는 Vercel 무료 최적화 한도로 금지(CLAUDE.md) → 일반 img */}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
