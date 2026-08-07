import type { ReactNode } from "react";
import type { UISize } from "./types";

type BadgeStatus = "online" | "offline";

interface BadgeProps {
  status: BadgeStatus;
  size?: UISize;
  children: ReactNode;
}

const SIZE: Record<UISize, { box: string; dot: string; text: string }> = {
  sm: { box: "gap-1 py-1 px-2.5", dot: "h-1 w-1", text: "text-xs" },
  md: { box: "gap-1.5 py-1.5 px-3", dot: "h-1.5 w-1.5", text: "text-caption" },
  lg: { box: "gap-2 py-2 px-3.5", dot: "h-2 w-2", text: "text-sm" },
};

export default function Badge({ status, size = "md", children }: BadgeProps) {
  const { box, dot, text } = SIZE[size];
  return (
    <span className={`inline-flex items-center rounded-pill border border-hairline bg-surface ${box}`}>
      <span
        className={`rounded-pill ${dot} ${status === "online" ? "bg-success" : "bg-text-tertiary"}`}
      />
      <span className={`font-medium text-text-secondary ${text}`}>{children}</span>
    </span>
  );
}
