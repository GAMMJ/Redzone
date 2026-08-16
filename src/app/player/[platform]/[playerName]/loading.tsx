import Spinner from "@/components/ui/Spinner";
import Container from "@/components/layout/Container";

// 프로필 페이지 전환 로딩 — 검색/랭킹에서 이동 시 서버 렌더(PUBG 조회) 동안 표시.
export default function PlayerLoading() {
  return (
    <Container className="flex flex-col items-center justify-center gap-4 py-32">
      <Spinner size="lg" />
      <p className="text-caption text-text-tertiary">전적을 불러오는 중…</p>
    </Container>
  );
}
