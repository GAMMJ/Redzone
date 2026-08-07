import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import type { UISize } from "./types";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  icon?: LucideIcon;
  error?: boolean;
  size?: UISize;
}

const SIZE: Record<UISize, { box: string; icon: string; text: string }> = {
  sm: { box: "gap-2 py-2 px-3", icon: "h-4 w-4", text: "text-xs" },
  md: { box: "gap-2.5 py-3 px-4", icon: "h-[18px] w-[18px]", text: "text-sm" },
  lg: { box: "gap-3 py-3.5 px-5", icon: "h-5 w-5", text: "text-base" },
};

export default function Input({ icon: Icon, error = false, size = "md", className, ...rest }: InputProps) {
  const s = SIZE[size];
  return (
    <label
      className={`flex items-center rounded-md border bg-surface ${s.box} ${
        error ? "border-danger" : "border-hairline-strong"
      } ${className ?? ""}`}
    >
      {Icon && <Icon className={`shrink-0 text-text-tertiary ${s.icon}`} />}
      <input
        aria-invalid={error}
        className={`w-full min-w-0 bg-transparent text-text-primary outline-none placeholder:text-text-tertiary ${s.text}`}
        {...rest}
      />
    </label>
  );
}
