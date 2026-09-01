import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { FOCUS_RING } from "@/components/ui/focusRing";

interface LinkButtonProps {
  // href가 있으면 <Link>, 없으면 <span>(아직 이동 대상 없는 경우)로 렌더 — 서버 컴포넌트에서도 사용 가능
  href?: string;
  // 사이트 밖으로 나가는 링크. 새 탭으로 열고 라우터를 태우지 않는다.
  external?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  className?: string;
  children: ReactNode;
}

// 텍스트 링크형 버튼 — primary 텍스트 링크 스타일만 갖고, 레이아웃·hover는 className으로 조절.
export default function LinkButton({
  href,
  external = false,
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

  if (!href) return <span className={cls}>{inner}</span>;

  // 외부 주소는 <Link>로 감싸도 결국 <a>다. 프리페치·클라 내비게이션이 걸리지 않는 곳에
  // 라우터를 태우지 않는다. noreferrer까지 붙이는 건 새 탭이 window.opener로 우리 탭을
  // 만질 수 있어서다.
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cls} ${FOCUS_RING}`}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={`${cls} ${FOCUS_RING}`}>
      {inner}
    </Link>
  );
}
