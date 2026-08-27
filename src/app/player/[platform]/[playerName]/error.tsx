"use client";

import { Home, RotateCw } from "lucide-react";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import LinkButton from "@/components/ui/LinkButton";

// 프로필 구역에서만 쓰는 오류 경계.
//
// 루트 error.tsx만 있으면 상세 하나가 던져도 페이지 전체가 오류 화면이 되고, 사용자는
// 어느 플레이어를 보고 있었는지도 잃는다. 여기 두면 헤더·푸터는 남는다.
//
// 한도 초과(429)로 여기까지 오는 경우가 가장 흔하다. 다만 서버에서 난 오류는 digest만
// 클라로 내려오고 본문·헤더는 오지 않아, 몇 초 뒤에 되는지는 여기서 알 수 없다.
// 그래서 "잠시 후"까지만 말한다 — 아는 척하지 않는다.
export default function PlayerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="flex flex-col items-center gap-6 py-20 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-text-primary">전적을 불러오지 못했습니다</h2>
        <p className="text-caption text-text-secondary">
          조회가 몰리면 잠시 막힐 수 있습니다. 잠시 후 다시 시도해 주세요.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button icon={RotateCw} onClick={reset}>
          다시 시도
        </Button>
        <LinkButton
          href="/"
          icon={Home}
          iconPosition="left"
          className="gap-1.5 transition-opacity hover:opacity-80"
        >
          홈으로
        </LinkButton>
      </div>

      {error.digest && <p className="text-xs text-text-tertiary">오류 코드 {error.digest}</p>}
    </Container>
  );
}
