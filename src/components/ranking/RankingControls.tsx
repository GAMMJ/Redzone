import Link from "next/link";
import {
  RANKING_PLATFORMS,
  type RankingPlatform,
  type RankingOption,
} from "./rankingParams";

interface RankingControlsProps {
  platform: RankingPlatform;
}

// 세그먼트 한 그룹 — 각 옵션은 나머지 param을 유지한 채 자기 값만 바꾼 <Link>.
// 활성 옵션은 서버가 받은 현재값으로 판정해 스타일을 적용한다(클라 상태 없음).
interface SegmentGroupProps<T extends string> {
  label: string;
  options: RankingOption<T>[];
  current: T;
  hrefFor: (value: T) => string;
}

function SegmentGroup<T extends string>({
  label,
  options,
  current,
  hrefFor,
}: SegmentGroupProps<T>) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-caption font-medium text-text-tertiary">{label}</span>
      <div className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-surface p-1">
        {options.map((option) => {
          const isActive = option.value === current;
          return (
            <Link
              key={option.value}
              href={hrefFor(option.value)}
              aria-current={isActive ? "true" : undefined}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// 랭킹 필터 바 — 플랫폼 세그먼트 토글(RANKING_PLATFORMS 기준).
// 모드 토글은 두지 않는다(모드를 나눠 불러도 리더보드 값이 동일하게 내려옴).
export default function RankingControls({ platform }: RankingControlsProps) {
  const platformHref = (value: RankingPlatform) => `/ranking?platform=${value}`;

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
      <SegmentGroup
        label="플랫폼"
        options={RANKING_PLATFORMS}
        current={platform}
        hrefFor={platformHref}
      />
    </div>
  );
}
