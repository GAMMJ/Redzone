interface StatBarProps {
  value: number;
  // 바를 가득 채우는 기준값. 상한이 명확한 지표에만 쓴다(승률 100, 평균 딜량 1000 등).
  // 목록 최대값이 아니라 고정값을 쓰는 이유: 페이지·플랫폼이 바뀌어도 같은 값이 같은 길이로 보여야 비교가 된다.
  max: number;
  // 표시 텍스트는 반드시 value에서 파생시킨다 — 바 길이와 옆 숫자가 서로 다른 값이 될 수 없게 하기 위함
  formatValue: (value: number) => string;
  // 스크린리더가 읽을 지표 이름 ("승률" 등)
  ariaLabel: string;
  // 채움 바 색 — 디자인 토큰 배경 클래스로 넘긴다 (bg-danger·bg-info 등)
  fillClassName?: string;
}

// 채움 비율(%) — 0~100으로 clamp. max가 0 이하거나 값이 유한하지 않으면 0.
function toPercentage(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

// 값 + 채움 바 — 바 폭과 라벨 폭을 모두 고정해 행마다 바 시작점이 어긋나지 않게 한다.
// 자신은 inline-flex라 가로 정렬은 감싸는 셀의 text-align이 결정한다.
// 채움 폭은 데이터에서 나온 연속값이라 Tailwind 클래스로 표현할 수 없어 인라인 스타일을 쓴다.
export default function StatBar({
  value,
  max,
  formatValue,
  ariaLabel,
  fillClassName = "bg-primary",
}: StatBarProps) {
  const percentage = toPercentage(value, max);

  return (
    <span className="inline-flex items-center gap-2">
      <span
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-hairline"
      >
        <span
          className={`block h-full rounded-full ${fillClassName}`}
          style={{ width: `${percentage}%` }}
        />
      </span>
      {/* 폭은 고정하되 좌측 정렬 — 값이 짧아도 바 바로 옆에 붙고, 행마다 바 시작점은 그대로 유지된다 */}
      <span className="w-12 shrink-0 text-left font-mono text-sm text-text-secondary">
        {formatValue(value)}
      </span>
    </span>
  );
}
