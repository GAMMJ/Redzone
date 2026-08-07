import type { UISize } from "./types";

interface SpinnerProps {
  size?: UISize;
  className?: string;
}

// 크기별 지름 + 테두리 두께 — border-t만 primary로 채워 회전 시 원호가 도는 형태
const SIZE: Record<UISize, string> = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

// primary 색 로딩 스피너 — 옅은 primary 링 위에 진한 primary 원호가 회전
export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="로딩 중"
      className={`inline-block animate-spin rounded-full border-primary/20 border-t-primary ${SIZE[size]} ${className}`}
    />
  );
}
