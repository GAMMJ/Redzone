import { formatTier } from "@/lib/tier";

interface TierLabelProps {
  tier: string;
  subTier: string;
  className?: string;
}

// 티어 표시 — 현재는 텍스트만("Diamond 2"). 이후 티어 이미지 에셋이 생기면
// 이 컴포넌트 한 곳에 <img>만 추가하면 쓰는 곳(랭킹·프로필 등)에 전부 반영된다.
export default function TierLabel({ tier, subTier, className = "" }: TierLabelProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {formatTier(tier, subTier)}
    </span>
  );
}
