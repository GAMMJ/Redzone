import { Suspense } from "react";
import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import RankingControls from "@/components/ranking/RankingControls";
import RankingTable from "@/components/ranking/RankingTable";
import RankingTableSkeleton from "@/components/ranking/RankingTableSkeleton";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { parseRankingPlatform, RANKING_LIMIT } from "@/components/ranking/rankingParams";
import { getCurrentSeason } from "@/lib/pubg/records";
import { PLATFORM_LABEL } from "@/lib/constants";

// 리더보드·시즌은 매 요청 렌더(업스트림은 Redis 캐시로 보호). 빌드 타임 PUBG 호출 방지.
export const dynamic = "force-dynamic";

interface RankingSearchParams {
  platform?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RankingSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const platform = parseRankingPlatform(params.platform);
  const title = `PUBG 랭킹 · ${PLATFORM_LABEL[platform]} 경쟁전 상위 ${RANKING_LIMIT} | 레드존`;
  const description = `${PLATFORM_LABEL[platform]} 경쟁전 상위 ${RANKING_LIMIT}명의 티어·레이팅·평균 딜량·전적을 확인하세요.`;
  return { title, description, openGraph: { title, description } };
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<RankingSearchParams>;
}) {
  const params = await searchParams;
  const platform = parseRankingPlatform(params.platform);

  // 시즌은 고른 플랫폼으로 조회한다.
  //
  // steam·kakao는 PC 시즌을 공유하지만 콘솔은 id 자체가 다르다
  // (`division.bro.official.pc-2018-42` vs `...console-42`, findings/pubg-shards.md 실측).
  // steam으로 고정해 두면 Xbox 리더보드에 PC 시즌 id를 넘기게 되고, 그 조합은 응답이 없다.
  const season = await getCurrentSeason(platform);

  return (
    <Container className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-text-primary">랭킹</h1>
        <p className="text-caption text-text-secondary">
          {season.data ? `시즌 ${season.data.number} · ` : ""}
          {PLATFORM_LABEL[platform]} 경쟁전 상위 {RANKING_LIMIT}명
        </p>
      </div>

      <RankingControls platform={platform} />

      {/* platform을 Suspense key로 삼아 토글 시 스켈레톤이 다시 뜨게 한다 */}
      <Suspense key={platform} fallback={<RankingTableSkeleton />}>
        <RankingTable platform={platform} season={season} />
      </Suspense>

      {/* 상위 100명이 한 화면에 안 들어간다. 플랫폼을 바꾸는 컨트롤이 맨 위에 있어
          아래를 보다가 돌아오려면 한참 올라와야 했다. */}
      <ScrollToTop />
    </Container>
  );
}
