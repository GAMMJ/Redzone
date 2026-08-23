"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import Button from "@/components/ui/Button";

// 재사용 대기 시간(초). 프록시 캐시가 60초라 이보다 짧게 잡으면 눌러도 같은 값이 나온다.
const COOLDOWN_SECONDS = 300;

// 마지막 갱신 시각은 플레이어별로 남긴다 — 다른 사람을 조회할 때 대기가 딸려오면 안 된다.
function storageKey(platform: string, name: string): string {
  return `redzon-last-update:${platform}:${name}`;
}

// 저장된 시각 기준 남은 초. 기록이 없거나 읽을 수 없으면 0(=바로 사용 가능).
function readRemaining(key: string): number {
  try {
    const savedAt = Number(window.localStorage.getItem(key));
    if (!Number.isFinite(savedAt) || savedAt <= 0) return 0;
    const elapsed = Math.floor((Date.now() - savedAt) / 1000);
    return Math.max(0, COOLDOWN_SECONDS - elapsed);
  } catch {
    // 사생활 보호 모드 등으로 localStorage를 못 읽으면 제한 없이 쓴다
    return 0;
  }
}

interface UpdateButtonProps {
  platform: string;
  name: string;
}

export default function UpdateButton({ platform, name }: UpdateButtonProps) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(0);
  const key = storageKey(platform, name);

  useEffect(() => {
    // localStorage는 서버에 없다. 첫 렌더를 0으로 맞춘 뒤 마운트 후에 읽어야 hydration이 어긋나지 않는다.
    // 다만 effect 본문에서 바로 setState하면 연쇄 렌더가 되므로 첫 계산도 콜백으로 미룬다.
    // 매초 저장된 시각에서 다시 계산한다 — 1씩 빼는 것보다 탭이 멈췄다 돌아와도 정확하다.
    const sync = () => setRemaining(readRemaining(key));
    const firstRead = requestAnimationFrame(sync);
    const timer = setInterval(sync, 1000);
    return () => {
      cancelAnimationFrame(firstRead);
      clearInterval(timer);
    };
  }, [key]);

  function handleUpdate() {
    try {
      window.localStorage.setItem(key, String(Date.now()));
    } catch {
      // 저장에 실패해도 갱신은 진행한다. 새로고침하면 대기가 풀릴 뿐이다.
    }
    setRemaining(COOLDOWN_SECONDS);
    router.refresh();
  }

  const waiting = remaining > 0;

  return (
    <Button
      variant="secondary"
      size="md"
      icon={RotateCw}
      disabled={waiting}
      onClick={handleUpdate}
    >
      {waiting ? `${remaining}초 후 가능` : "전적 업데이트"}
    </Button>
  );
}
