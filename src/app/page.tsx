import Hero from "@/components/home/Hero";
import LiveRanking from "@/components/home/LiveRanking";
import TrendingPlayers from "@/components/home/TrendingPlayers";
import NewsSection from "@/components/home/NewsSection";
import Container from "@/components/layout/Container";

export default function Home() {
  return (
    <>
      {/* Hero는 흰 배경(bg-surface) 풀블리드, 이하 섹션은 페이지 배경 위 */}
      <Hero />

      <Container className="flex flex-col gap-14 py-14">
        {/* 실시간 랭킹(넓게) + 지금 뜨는 플레이어(좁게) */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.8fr_1fr]">
          <LiveRanking />
          <TrendingPlayers />
        </section>

        <NewsSection />
      </Container>
    </>
  );
}
