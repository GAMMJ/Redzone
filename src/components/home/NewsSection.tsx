import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import NewsCards from "./NewsCards";
import LinkButton from "@/components/ui/LinkButton";
import { PUBG_NEWS_URL } from "@/lib/paths";
import { CARD_COUNT } from "@/lib/steam/news";

/** 스켈레톤 카드 수. 장수를 여기 따로 적으면 한쪽만 고쳐 어긋나므로 조회 쪽 상수를 그대로 쓴다. */
const CARDS = Array.from({ length: CARD_COUNT });

/**
 * 홈 "최신 PUBG 뉴스" 섹션.
 *
 * 부제에서 e스포츠를 뺐다. 출처가 글로벌 공지 피드라 국내 리그(PWS) 소식이 아예 들어오지
 * 않는다 — 없는 것을 있다고 적어 두면 그게 다시 목업 시절의 거짓말이 된다.
 *
 * 조회는 NewsCards 안에 있고 여기는 동기다. 헤더를 경계 밖에 두면 스켈레톤이 헤더를
 * 다시 그릴 필요가 없다 — 두 벌로 갈라 두면 한쪽만 고쳐 어긋난다.
 */
export default function NewsSection() {
  return (
    <section>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-bold text-text-primary">최신 PUBG 뉴스</h2>
          <span className="text-caption text-text-tertiary">
            패치 노트, 개발 소식, 상점 업데이트
          </span>
        </div>
        <LinkButton
          href={PUBG_NEWS_URL}
          external
          icon={ArrowRight}
          className="transition-opacity hover:opacity-80"
        >
          전체 뉴스
        </LinkButton>
      </div>

      <div className="mt-6">
        <Suspense fallback={<NewsCardsSkeleton />}>
          <NewsCards />
        </Suspense>
      </div>
    </section>
  );
}

/** 카드 셸은 그대로 두고 안쪽만 pulse로 채워 레이아웃 이동(CLS)을 막는다. */
function NewsCardsSkeleton() {
  return (
    <div role="status" aria-label="뉴스 불러오는 중" className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {CARDS.map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-5 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <span className="block h-6 w-14 animate-pulse rounded-pill bg-hairline" />
            <span className="block h-4 w-20 animate-pulse rounded bg-hairline" />
          </div>
          <span className="block h-4 w-full animate-pulse rounded bg-hairline" />
          <span className="block h-4 w-2/3 animate-pulse rounded bg-hairline" />
          <span className="mt-auto block h-4 w-28 animate-pulse rounded bg-hairline" />
        </div>
      ))}
    </div>
  );
}
