import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { UISize } from "./types";

type ButtonVariant = "primary" | "secondary" | "link";

// 네이티브 button 속성을 그대로 받는다. 확장하지 않으면 aria-expanded 같은 하이픈 속성이
// props 객체에 담긴 채 조용히 버려진다 — TS는 하이픈 속성을 초과 프로퍼티 검사에서 제외해 못 잡는다.
interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick"> {
  variant?: ButtonVariant;
  size?: UISize;
  type?: "button" | "submit";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  onClick?: () => void;
  // 아이콘만 있는 버튼 등 텍스트 라벨이 없을 때 스크린리더용 라벨
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}

const SIZE: Record<UISize, { box: string; icon: string }> = {
  sm: { box: "gap-1.5 py-1.5 px-3 text-xs", icon: "h-4 w-4" },
  md: { box: "gap-2 py-2.5 px-[18px] text-sm", icon: "h-[18px] w-[18px]" },
  lg: { box: "gap-2.5 py-3 px-5 text-base", icon: "h-5 w-5" },
};

export default function Button({
  variant = "primary",
  size = "md",
  type = "button",
  icon: Icon,
  iconPosition = "left",
  disabled = false,
  onClick,
  ariaLabel,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  // link는 배경 없는 텍스트 링크라 SIZE 박스 패딩을 타지 않고 고정 스타일 사용
  const isLink = variant === "link";

  const base = isLink
    ? "inline-flex items-center gap-1 text-caption font-medium transition-opacity hover:opacity-80"
    : "inline-flex items-center justify-center rounded-sm font-semibold transition-colors";

  const variantClass = isLink
    ? "text-primary"
    : variant === "secondary"
      ? "bg-surface border border-hairline-strong text-text-primary hover:bg-surface-subtle"
      : "bg-primary text-text-primary hover:brightness-95";

  const { box, icon } = SIZE[size];
  const boxClass = isLink ? "" : box;
  const iconClass = isLink
    ? "h-3.5 w-3.5 shrink-0"
    : variant === "secondary"
      ? `${icon} text-text-secondary`
      : icon;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      {...rest}
      className={`${base} ${boxClass} ${variantClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      {Icon && iconPosition === "left" && <Icon className={iconClass} />}
      {children}
      {Icon && iconPosition === "right" && <Icon className={iconClass} />}
    </button>
  );
}
