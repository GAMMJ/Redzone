import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UISize } from "./types";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  size?: UISize;
}

const SIZE: Record<UISize, { nav: string; cell: string; icon: string; text: string }> = {
  sm: { nav: "gap-1", cell: "h-8 w-8", icon: "h-3.5 w-3.5", text: "text-xs" },
  md: { nav: "gap-1.5", cell: "h-9 w-9", icon: "h-4 w-4", text: "text-caption" },
  lg: { nav: "gap-2", cell: "h-10 w-10", icon: "h-[18px] w-[18px]", text: "text-sm" },
};

const DOTS = "dots";

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

// 첫/끝 페이지 + 현재 주변 형제 + 양끝 사이 생략(…) 계산
function getPageItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): (number | typeof DOTS)[] {
  const totalNumbers = siblingCount * 2 + 5;
  if (totalNumbers >= totalPages) return range(1, totalPages);

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;

  if (!showLeftDots && showRightDots) {
    return [...range(1, siblingCount * 2 + 3), DOTS, totalPages];
  }
  if (showLeftDots && !showRightDots) {
    return [1, DOTS, ...range(totalPages - (siblingCount * 2 + 2), totalPages)];
  }
  return [1, DOTS, ...range(leftSibling, rightSibling), DOTS, totalPages];
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  size = "md",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const s = SIZE[size];
  const items = getPageItems(currentPage, totalPages, siblingCount);

  return (
    <nav className={`flex items-center ${s.nav}`} aria-label="페이지 이동">
      <button
        type="button"
        aria-label="이전 페이지"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`flex items-center justify-center rounded-sm border border-hairline bg-surface disabled:pointer-events-none disabled:opacity-50 ${s.cell}`}
      >
        <ChevronLeft aria-hidden className={`text-text-secondary ${s.icon}`} />
      </button>

      {items.map((item, index) => {
        if (item === DOTS) {
          return (
            <span
              key={`dots-${index}`}
              className={`flex items-center justify-center font-semibold text-text-tertiary ${s.cell} ${s.text}`}
            >
              …
            </span>
          );
        }
        const isActive = item === currentPage;
        return (
          <button
            key={item}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={`flex items-center justify-center rounded-sm border font-semibold ${s.cell} ${s.text} ${
              isActive
                ? "border-primary bg-primary text-text-primary"
                : "border-hairline bg-surface text-text-secondary hover:bg-surface-subtle"
            }`}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        aria-label="다음 페이지"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`flex items-center justify-center rounded-sm border border-hairline bg-surface disabled:pointer-events-none disabled:opacity-50 ${s.cell}`}
      >
        <ChevronRight aria-hidden className={`text-text-secondary ${s.icon}`} />
      </button>
    </nav>
  );
}
