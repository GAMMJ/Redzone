import Container from "@/components/layout/Container";
import RankingTableSkeleton from "@/components/ranking/RankingTableSkeleton";

// 라우트 전환·새로고침 시 노출 — 페이지 셸(제목·컨트롤 자리)과 테이블 스켈레톤을 표시.
export default function RankingLoading() {
  return (
    <Container className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-24 animate-pulse rounded bg-hairline" />
        <div className="h-4 w-64 animate-pulse rounded bg-hairline" />
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-hairline" />
        <div className="h-9 w-40 animate-pulse rounded-lg bg-hairline" />
      </div>

      <RankingTableSkeleton />
    </Container>
  );
}
