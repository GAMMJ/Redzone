import type { ReactNode } from "react";

// 프로필 대제목 — 왼쪽 primary 액센트 바 + 굵은 제목
export default function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-xl font-bold text-text-primary">
      <span className="h-5 w-1 rounded-pill bg-primary" />
      {children}
    </h2>
  );
}
