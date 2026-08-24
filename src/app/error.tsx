"use client";

import { useEffect } from "react";
import { Home, RotateCw, TriangleAlert } from "lucide-react";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import LinkButton from "@/components/ui/LinkButton";

interface ErrorProps {
  error: Error & { digest?: string };
  // 이 구역만 다시 렌더한다. 페이지를 새로 여는 게 아니라 실패한 지점만 재시도한다.
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 서버에서 난 오류는 digest로만 식별된다(원문은 클라에 내려오지 않는다).
    // 배포 후 로그와 대조할 수 있게 콘솔에 남긴다.
    console.error("[error boundary]", error.digest ?? error.message);
  }, [error]);

  return (
    <Container className="flex flex-col items-center gap-8 py-20">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-surface-muted">
          <TriangleAlert aria-hidden className="h-8 w-8 text-text-tertiary" />
        </span>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-text-primary">문제가 발생했습니다</h1>
          <p className="text-caption text-text-secondary">
            일시적인 오류일 수 있습니다. 다시 시도해 주세요.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <Button icon={RotateCw} onClick={reset}>
          다시 시도
        </Button>
        <LinkButton
          href="/"
          icon={Home}
          iconPosition="left"
          className="gap-1.5 transition-opacity hover:opacity-80"
        >
          홈으로 돌아가기
        </LinkButton>
      </div>

      {/* 문의 시 이 값을 알려주면 서버 로그에서 해당 오류를 바로 찾을 수 있다 */}
      {error.digest && <p className="text-xs text-text-tertiary">오류 코드 {error.digest}</p>}
    </Container>
  );
}
