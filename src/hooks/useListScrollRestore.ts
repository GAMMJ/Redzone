"use client";

import { useEffect, useRef } from "react";
import {
  forgetStored,
  isFresh,
  opensElsewhere,
  readStored,
  RESTORE_WAIT_MS,
  writeStored,
} from "@/lib/viewRestore";

/** 음수·NaN·빈 값을 모두 0으로 떨어뜨린다. 브라우저가 어차피 하는 클램프와 같다. */
function clampOffset(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * 적어 둔 `"세로:가로:시각"`을 읽는다. 적어 둔 것을 그대로 믿지 않는다 —
 * `sessionStorage`는 사람이 고칠 수 있고, 옛 형식이 남아 있을 수도 있다.
 *
 * 세로와 가로를 같은 규칙으로 다룬다. 한쪽이 이상하다고 나머지까지 버리면
 * `"-5:300"` 같은 값에서 멀쩡한 가로 자리가 함께 사라진다.
 *
 * 시각이 없거나 오래됐으면 통째로 버린다 — 펼친 카드와 수명을 맞추기 위해서다.
 * 여기만 오래 살아남으면, 카드는 접힌 채 떠 놓고 그 매치를 다시 펼쳤을 때
 * 표만 옛 자리에서 열린다.
 */
function parseOffset(raw: string | null): { top: number; left: number } {
  const none = { top: 0, left: 0 };
  if (raw === null) return none;
  const [top, left, at] = raw.split(":").map(Number);
  if (!isFresh(at)) return none;
  return { top: clampOffset(top), left: clampOffset(left) };
}

/**
 * 자체 스크롤을 가진 목록이 뒤로 왔을 때 보던 자리로 돌아오게 한다.
 *
 * 참가자 표는 `max-h-[560px] overflow-auto`라 **문서가 아니라 이 상자가** 스크롤된다.
 * 브라우저의 스크롤 복원은 문서에만 해당하므로, 표 안에서 한참 내려가 11등을 눌러 남의
 * 프로필에 갔다 오면 표는 맨 위로 돌아가 있다. 문서 스크롤은 멀쩡히 복원되기 때문에
 * "일부만 안 된다"는 모양이 된다.
 *
 * 자리는 **링크를 누르는 순간** 적고, 되살릴 때 **한 번 쓰고 지운다**. 두 규칙 다 이유가 있다.
 *
 * - 스크롤할 때마다 적으면 화면이 걷히는 동안의 값이 섞여 들어온다.
 * - 지우지 않으면 카드를 접었다 다시 펼쳤을 때, 처음 펼친 표가 옛 자리에서 열린다.
 *   새로고침해도 `sessionStorage`는 살아남으므로 계속 되살아난다.
 */
export function useListScrollRestore<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const storageKey = `list-scroll:${key}`;
    const stored = readStored(storageKey);
    const saved = parseOffset(stored);

    // 되살릴 것이 없는데 적힌 것은 있다 — 만료됐거나 형태가 깨진 경우다.
    // 아래 되살리기 경로를 타지 않으므로 여기서 치우지 않으면 탭을 닫을 때까지 남는다.
    if (stored !== null && saved.top === 0 && saved.left === 0) forgetStored(storageKey);

    let raf = 0;
    let done = false;
    const startedAt = performance.now();

    // 상세는 카드를 펼친 뒤에 조회하므로, 마운트 직후에는 행이 아직 다 그려지지 않아
    // 저장한 자리까지 자라지 않았을 수 있다. 담을 만해질 때까지 기다린다.
    const restore = () => {
      if (done || !ref.current) return;
      const box = ref.current;
      const grownEnough = box.scrollHeight - box.clientHeight >= saved.top;
      const waitedTooLong = performance.now() - startedAt > RESTORE_WAIT_MS;

      // 가로는 안쪽 폭(min-w)이 고정이라 처음부터 자리가 있다. 세로가 자라기를
      // 기다리는 것과 묶지 않는다 — 끝내 안 자라 포기할 때 되돌릴 수 있었던 가로까지 버려진다.
      box.scrollLeft = saved.left;
      if (grownEnough) box.scrollTop = saved.top;
      if (grownEnough || waitedTooLong) {
        // 끝내 못 담았더라도 들고 있어 봐야 다음에 엉뚱한 자리에서 되살아난다.
        done = true;
        forgetStored(storageKey);
        return;
      }
      raf = requestAnimationFrame(restore);
    };

    if (saved.top > 0 || saved.left > 0) restore();

    const onClick = (event: MouseEvent) => {
      if (opensElsewhere(event)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      // 조건은 RecentMatches의 handleSectionClick과 맞춰 둔다. 지금은 표 안에 플레이어
      // 링크뿐이라 결과가 같지만, 두 저장 경로가 갈라지면 한쪽만 적히는 상태가 된다.
      if (!target.closest('a[href^="/player/"]')) return;
      writeStored(
        storageKey,
        `${Math.round(el.scrollTop)}:${Math.round(el.scrollLeft)}:${Date.now()}`,
      );
    };
    el.addEventListener("click", onClick, true);

    return () => {
      done = true;
      cancelAnimationFrame(raf);
      el.removeEventListener("click", onClick, true);
    };
  }, [key]);

  return ref;
}
