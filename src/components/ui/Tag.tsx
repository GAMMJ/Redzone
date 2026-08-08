import type { ReactNode } from "react";

interface TagProps {
  children: ReactNode;
  className?: string;
}

// 정적 라벨 알약 — 카테고리·태그 표시용(비인터랙티브). 클릭되는 필터는 Chip(추후)로 별도.
export default function Tag({ children, className = "" }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary ${className}`}
    >
      {children}
    </span>
  );
}
