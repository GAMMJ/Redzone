"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import Button from "@/components/ui/Button";

/**
 * 조회에 실패했음을 알리고 그 자리에서 다시 시도하게 한다.
 *
 * "없음"과 "못 불러옴"을 가려 말하는 것이 이 컴포넌트의 존재 이유다. 문구가 화면마다
 * 흩어지면 한쪽만 고쳐 어긋나므로 여기 모은다 — 어떤 화면에서 실패하든 사용자가 보는
 * 말과 할 수 있는 일이 같아야 한다.
 *
 * 서버 컴포넌트가 그린 자리에서 쓰이므로 재시도는 `router.refresh()`다. 페이지를 새로
 * 여는 게 아니라 서버 렌더만 다시 받으므로, 사용자가 보던 자리와 클라이언트 상태가 남는다.
 * `useTransition`으로 감싸 진행 중임을 버튼에 드러낸다 — 429가 잦은 서비스라 눌러 놓고
 * 아무 반응이 없으면 고장으로 읽힌다.
 */
interface LoadFailureProps {
  /** 무엇을 못 불러왔는지. "랭킹을 불러오지 못했습니다"처럼 대상이 드러나게 쓴다. */
  message: string;
  className?: string;
}

export default function LoadFailure({ message, className = "" }: LoadFailureProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className={`flex flex-col items-center gap-3 px-6 py-8 text-center ${className}`}>
      <p className="text-caption text-text-secondary">{message}</p>
      <Button
        variant="secondary"
        size="sm"
        icon={RotateCw}
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? "불러오는 중" : "다시 시도"}
      </Button>
    </div>
  );
}
