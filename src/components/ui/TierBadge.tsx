import { formatTier } from "@/lib/tier";
import { divisionProgress, tierIconPath, tierStyle } from "@/lib/pubg/tierAssets";

type BadgeSize = "sm" | "md";

interface TierBadgeProps {
  tier: string;
  subTier: string;
  /** 레이팅 점수. 없으면 티어만 보여 준다. */
  rankPoint?: number;
  size?: BadgeSize;
  className?: string;
}

/**
 * 티어 아이콘 + 티어명 + 레이팅.
 *
 * 아이콘을 왼쪽에 두는 이유는 등급별로 색과 형태가 뚜렷해서다(브론즈 낙하산 → 실버 육각 →
 * 골드 별 → 플래티넘·크리스탈·다이아 성장형). 숫자를 읽기 전에 파악된다.
 *
 * `md`(카드 중앙)는 **라벨과 값을 위아래로 나눈다.** 한 줄에 늘어놓으면
 * "Gold 1   2,154 RP"처럼 크기가 비슷한 것 셋이 나란히 놓여, 무엇을 먼저 봐야 하는지가
 * 사라진다. 티어명을 작은 라벨로 올리고 RP를 큰 숫자로 내리면 눈이 한 번에 값으로 간다.
 * 아래 스탯 8칸이 전부 "라벨 → 숫자" 짝이라 결도 맞는다.
 *
 * `sm`(프로필 헤더)은 닉네임 아래 한 줄짜리 자리라 옆으로 눕힌다.
 */
export default function TierBadge({
  tier,
  subTier,
  rankPoint,
  size = "md",
  className = "",
}: TierBadgeProps) {
  const icon = tierIconPath(tier, subTier);
  const name = formatTier(tier, subTier);
  const hasRp = typeof rankPoint === "number";

  // 모르는 티어면 경로가 null이다 — 깨진 이미지 대신 글자만 남긴다.
  // next/image는 금지(CLAUDE.md)라 일반 img에 크기를 직접 준다(CLS 방지).
  // 티어명이 바로 옆에 글자로 있으므로 이 그림은 장식이다 → alt는 빈 값.
  const image = (px: number) =>
    icon ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={icon} alt="" width={px} height={px} className="shrink-0" />
    ) : null;

  const style = tierStyle(tier);

  if (size === "sm") {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        {image(26)}
        <span className={`text-caption font-bold ${style.fg}`}>{name}</span>
        {hasRp && (
          <span className="font-mono text-caption font-bold text-primary">
            {rankPoint.toLocaleString()}
            <span className="ml-0.5 text-[11px] font-semibold text-text-tertiary">RP</span>
          </span>
        )}
      </span>
    );
  }

  const progress = hasRp ? divisionProgress(tier, rankPoint) : null;

  return (
    // 티어색 패널로 이 구역을 아래 스탯 8칸과 갈라 놓는다.
    // 카드 안에서 "이 사람이 누구인가(등급)"와 "무엇을 했나(지표)"는 성격이 다른 정보다.
    <div className={`flex flex-col gap-3 rounded-lg px-5 py-4 ${style.bg} ${className}`}>
      <div className="flex items-center justify-center gap-4">
        {image(60)}
        {/* 글자 묶음은 왼쪽 정렬 — 라벨과 숫자의 시작선이 맞아야 위아래로 읽힌다.
            묶음 전체는 그 위에서 가운데로 놓는다. */}
        <div className="flex flex-col items-start gap-1">
          <span className={`text-sm font-bold tracking-wide ${style.fg}`}>{name}</span>
          {hasRp && (
            <span className="font-mono text-[26px] font-bold leading-none text-text-primary">
              {rankPoint.toLocaleString()}
              {/* 단위는 한참 낮춰 숫자가 먼저 읽히게 한다 */}
              <span className="ml-1 text-caption font-semibold text-text-tertiary">RP</span>
            </span>
          )}
        </div>
      </div>

      {/* 지금 단계에서 얼마나 왔는지. RP 숫자만으로는 다음 단계까지 얼마 남았는지
          사용자가 직접 계산해야 한다. Master·Survivor는 단계가 없어 바가 없다. */}
      {progress && (
        <div className="flex flex-col gap-1.5">
          <span
            role="progressbar"
            aria-label={`${name} 단계 진행도`}
            aria-valuenow={Math.round(progress.ratio * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 w-full overflow-hidden rounded-full bg-surface"
          >
            {/* 채움 폭은 데이터에서 나온 연속값이라 Tailwind 클래스로 표현할 수 없다 */}
            <span
              className={`block h-full rounded-full ${style.fill}`}
              style={{ width: `${Math.round(progress.ratio * 100)}%` }}
            />
          </span>
          <span className="text-center text-caption text-text-secondary">
            다음 단계까지{" "}
            <span className="font-mono font-bold text-text-primary">{progress.remaining}</span> RP
          </span>
        </div>
      )}
    </div>
  );
}
