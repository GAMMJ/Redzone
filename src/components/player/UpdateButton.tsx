"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import Button from "@/components/ui/Button";
import { track } from "@/lib/analytics";

// 재사용 대기 시간(초).
//
// 갱신 대상의 캐시 TTL(`PLAYER_REFRESH_TTL` = 240초)보다 길어야 한다. 짧으면 눌러도
// 캐시에서 같은 값이 나온다. 같게 두는 것도 안 된다 — **두 타이머의 시작점이 다르다.**
// 이쪽은 마지막으로 누른 시각부터 세고, 캐시는 캐시가 쓰인 시각부터 센다. 내가 페이지를
// 연 뒤 다른 사람이 같은 플레이어를 조회하면 캐시가 그때 새로 쓰여, 내 쿨다운이 풀릴 때
// 캐시가 아직 살아 있다. 그 어긋남을 덮는 여유가 60초다.
//
// 값을 바꾸면 `playerConstants.ts`의 `UPDATE_COOLDOWN`도 같이 고칠 것 — 그쪽이 TTL을
// 이 값에서 빼서 정한다. (여기 상수를 그쪽이 import할 수 없다. 이 파일은 클라이언트다.)
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
  /**
   * 방금 그린 화면이 실패한 값으로 채워졌는가.
   *
   * `router.refresh()`는 성공·실패를 돌려주지 않는다. 대신 갱신이 끝난 뒤 새로 내려온 이 값을
   * 보면 결과를 알 수 있다 — 실패한 채로 돌아왔다면 대기를 걸지 않는다.
   * 실패했을 때야말로 다시 눌러야 하는데 그때 잠기는 것이 이 버튼의 가장 나쁜 점이었다.
   */
  loadFailed?: boolean;
}

export default function UpdateButton({ platform, name, loadFailed = false }: UpdateButtonProps) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(0);
  const [refreshing, startTransition] = useTransition();
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

  // 갱신이 끝난 뒤에 대기를 건다.
  //
  // 예전에는 누르자마자 걸었다. router.refresh()는 결과를 돌려주지 않으니 실패해도 대기가
  // 남았고, 사용자는 5분간 다시 누를 수 없었다 — 실패했을 때야말로 다시 눌러야 하는데.
  //
  // transition이 끝나면 새 화면이 이미 그려져 있으므로 loadFailed가 이번 결과를 말해 준다.
  // 실패한 채로 돌아왔으면 대기를 걸지 않아 곧바로 다시 누를 수 있다.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current || refreshing) return;
    startedRef.current = false;
    if (loadFailed) return;
    try {
      window.localStorage.setItem(key, String(Date.now()));
    } catch {
      // 저장에 실패해도 갱신 자체는 끝났다. 새로고침하면 대기가 풀릴 뿐이다.
    }
    // 위 sync 타이머가 1초 안에 같은 값을 계산해 내지만, 그 사이 버튼이 잠깐 열려 있어
    // 두 번 눌릴 수 있다. 곧바로 반영하되 렌더 중 상태 변경이 되지 않게 한 프레임 미룬다.
    const id = requestAnimationFrame(() => setRemaining(COOLDOWN_SECONDS));
    return () => cancelAnimationFrame(id);
  }, [refreshing, loadFailed, key]);

  function handleUpdate() {
    startedRef.current = true;

    // 이 버튼은 검색과 똑같이 PUBG 3콜을 쓴다. autocapture가 클릭은 잡지만 버튼 글씨만
    // 봐서는 그게 한도를 쓴 것인지 알 수 없어, 검색만 세면 실제 소비의 절반만 보게 된다.
    //
    // 실패해서 눌렀는지 함께 남긴다. 실패 뒤 재시도가 많다면 한도가 아니라 캐시가 문제다.
    track("player_refreshed", { platform, after_failure: loadFailed });

    startTransition(() => router.refresh());
  }

  const waiting = remaining > 0;

  return (
    <Button
      variant="secondary"
      size="md"
      icon={RotateCw}
      // 갱신이 도는 동안에도 막는다. 연달아 누르면 같은 요청이 겹쳐 한도만 쓴다.
      disabled={waiting || refreshing}
      onClick={handleUpdate}
    >
      {/* 누르고 1~3초간 아무 반응이 없으면 고장으로 읽힌다 */}
      {refreshing ? "업데이트 중" : waiting ? `${remaining}초 후 가능` : "전적 업데이트"}
    </Button>
  );
}
