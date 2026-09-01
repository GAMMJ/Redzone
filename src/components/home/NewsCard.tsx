import { ArrowUpRight } from "lucide-react";
import Tag from "@/components/ui/Tag";
import { FOCUS_RING } from "@/components/ui/focusRing";
import { pubgNewsPath } from "@/lib/paths";
import type { NewsItem } from "@/lib/steam/news";

/**
 * 홈 뉴스 카드.
 *
 * 카드 전체가 링크다. 제목만 링크로 두면 카드의 나머지 여백이 눌리지 않아, 보기엔
 * 누를 수 있게 생긴 면적 대부분이 죽는다.
 *
 * 썸네일 자리는 두지 않는다. 스팀 공지 중 이미지를 가진 것이 최근 20건에 3건뿐이라,
 * 자리를 만들면 대부분의 카드가 회색 상자를 이고 있게 된다.
 */
export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="rounded-lg border border-hairline bg-surface shadow-xs transition-shadow hover:shadow-sm">
      <a
        href={pubgNewsPath(item.id)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${FOCUS_RING} flex h-full flex-col gap-3 rounded-lg p-5`}
      >
        <div className="flex items-center gap-2.5">
          <Tag>{item.category}</Tag>
          <span className="text-xs text-text-tertiary">{formatDate(item.date)}</span>
        </div>

        {/* 두 줄에서 자른다. 안 자르면 긴 제목([Dev Letter] …(NA, SA, EU))이 1/3 폭에서 세 줄이
            되어 카드 하나만 키가 커지고, 스켈레톤이 잡아 둔 자리와도 어긋난다. */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-normal text-text-primary">
          {item.title}
        </h3>

        {/* 사이트 밖으로 나간다는 것을 미리 알린다. 새 탭이 열리는 이유이기도 하다. */}
        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs text-text-tertiary">
          공식 뉴스에서 보기
          <ArrowUpRight aria-hidden className="h-3 w-3 shrink-0" />
        </span>
      </a>
    </article>
  );
}

/**
 * "2026.08.26" — 한국 시간 기준.
 *
 * 시간대를 못 박는 것이 요점이다. 서버 컴포넌트라 배포 서버의 시간대(UTC)로 찍히는데,
 * 공지는 한국시간 오후 3~4시에 몰려 올라온다. 그대로 두면 그 글들이 하루 전 날짜로 보인다.
 */
const DATE_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(unixSeconds: number): string {
  // ko-KR을 그대로 쓰면 "2026. 08. 26."처럼 공백과 끝점이 붙는다. 조각을 직접 잇는다.
  const parts = DATE_FORMAT.formatToParts(new Date(unixSeconds * 1000));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}.${pick("month")}.${pick("day")}`;
}
