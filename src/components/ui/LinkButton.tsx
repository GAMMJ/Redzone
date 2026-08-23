import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface LinkButtonProps {
  // href가 있으면 <Link>, 없으면 <span>(아직 이동 대상 없는 경우)로 렌더 — 서버 컴포넌트에서도 사용 가능
  href?: string;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  className?: string;
  children: ReactNode;
}

// 키보드 포커스 링 — Button.tsx와 동일한 표준을 쓴다. 이동 가능한 <Link>일 때만 의미가 있다.
const FOCUS_RING =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

// 텍스트 링크형 버튼 — primary 텍스트 링크 스타일만 갖고, 레이아웃·hover는 className으로 조절.
export default function LinkButton({
  href,
  icon: Icon,
  iconPosition = "right",
  className = "",
  children,
}: LinkButtonProps) {
  const cls = `inline-flex items-center gap-1 text-caption font-medium text-primary ${className}`;
  const inner = (
    <>
      {Icon && iconPosition === "left" && <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />}
      {children}
      {Icon && iconPosition === "right" && <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />}
    </>
  );

  return href ? (
    <Link href={href} className={`${cls} ${FOCUS_RING}`}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}
