"use client";

import { RotateCw } from "lucide-react";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";

// 랭킹 구역에서만 쓰는 오류 경계.
//
// 루트 error.tsx만 있으면 표 하나가 실패해도 페이지가 통째로 오류 화면이 된다.
// 여기 두면 헤더·제목·플랫폼 토글은 남고 실패한 구역만 이 화면으로 바뀐다.
// (조회 실패는 대부분 RankingTable이 안에서 처리한다 — 여기 오는 건 렌더 중 예외다.)
export default function RankingError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="flex flex-col items-center gap-6 py-20 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-text-primary">랭킹을 표시할 수 없습니다</h2>
        <p className="text-caption text-text-secondary">
          일시적인 문제일 수 있습니다. 다시 시도해 주세요.
        </p>
      </div>
      <Button icon={RotateCw} onClick={reset}>
        다시 시도
      </Button>
    </Container>
  );
}
