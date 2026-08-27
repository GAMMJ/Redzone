import { Home, Compass } from "lucide-react";
import Container from "@/components/layout/Container";
import LinkButton from "@/components/ui/LinkButton";

// 없는 주소로 들어왔을 때. 이 파일이 없으면 Next 기본 화면("This page could not be found.")이
// 뜨는데, 영어인 데다 헤더·푸터도 없어 돌아갈 길이 보이지 않는다.
// 플레이어 전용 not-found와 결을 맞춘다 — 무엇이 잘못됐는지 말하고 갈 곳을 준다.

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-8 py-20">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-surface-muted">
          <Compass aria-hidden className="h-8 w-8 text-text-tertiary" />
        </span>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-text-primary">페이지를 찾을 수 없습니다</h1>
          <p className="text-caption text-text-secondary">
            주소가 바뀌었거나 없는 페이지입니다. 아래에서 원하는 곳으로 이동해 주세요.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-5">
        <LinkButton
          href="/"
          icon={Home}
          iconPosition="left"
          className="gap-1.5 transition-opacity hover:opacity-80"
        >
          홈으로 돌아가기
        </LinkButton>
        <LinkButton href="/ranking" className="transition-opacity hover:opacity-80">
          랭킹 보기
        </LinkButton>
      </div>
    </Container>
  );
}
