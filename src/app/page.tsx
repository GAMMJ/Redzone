import { Suspense } from "react";
import Hero from "@/components/home/Hero";
import LiveRanking from "@/components/home/LiveRanking";
import LiveRankingSkeleton from "@/components/home/LiveRankingSkeleton";
import NewsSection from "@/components/home/NewsSection";
import Container from "@/components/layout/Container";
import { getCurrentSeason } from "@/lib/pubg/records";

// 실시간 랭킹·시즌은 매 요청 렌더(업스트림은 Redis 30분 캐시로 보호). 빌드 타임 PUBG 호출 방지.
export const dynamic = "force-dynamic";

export default async function Home() {
  // 현재 시즌을 1회 조회해 Hero 배지·양쪽 LiveRanking에 공유 (steam·kakao 모두 PC 시즌)
  const season = await getCurrentSeason("steam");

  return (
    <>
      {/* Hero는 흰 배경(bg-surface) 풀블리드, 이하 섹션은 페이지 배경 위 */}
      <Hero seasonNumber={season.data?.number ?? null} />

      <Container className="flex flex-col gap-14 py-14">
        {/* 스팀·카카오 실시간 랭킹 반반 — 리더보드 조회는 각 카드에서 스트리밍(셸 먼저 페인트) */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Suspense fallback={<LiveRankingSkeleton />}>
            <LiveRanking platform="steam" season={season} />
          </Suspense>
          <Suspense fallback={<LiveRankingSkeleton />}>
            <LiveRanking platform="kakao" season={season} />
          </Suspense>
        </section>

        <NewsSection />
      </Container>
    </>
  );
}
