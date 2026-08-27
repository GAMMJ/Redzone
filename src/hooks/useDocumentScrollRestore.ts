"use client";

import { useEffect, useRef } from "react";
import { RESTORE_WAIT_MS } from "@/lib/viewRestore";

/**
 * 뒤로 왔을 때 문서를 보던 자리로 되돌린다.
 *
 * 브라우저도 자리를 되돌리지만 **너무 이르다.** 매치 카드 상세는 펼친 뒤에 조회하므로
 * 브라우저가 움직이는 시점에는 문서가 아직 짧다. 그 뒤 카드가 펼쳐지며 콘텐츠가 위로
 * 들어오면 보던 자리가 밀린다.
 *
 * 그래서 문서가 그 자리를 담을 만큼 자란 뒤에 맞춘다.
 *
 * @param target 되돌릴 자리. `undefined`면 되돌릴 것이 없다는 뜻이다.
 * @param scope 이 값이 바뀌면 다른 화면으로 보고 다시 되돌릴 준비를 한다.
 */
export function useDocumentScrollRestore(target: number | undefined, scope: string) {
  // 되살린 자리는 한 번만 쓴다. 사람이 그 뒤에 스크롤한 것을 되돌리면 안 된다.
  const consumed = useRef<number | null>(null);

  useEffect(() => {
    if (target === undefined || consumed.current === target) return;
    consumed.current = target;

    let raf = 0;
    const startedAt = performance.now();
    const step = () => {
      if (document.documentElement.scrollHeight - window.innerHeight >= target) {
        window.scrollTo(0, target);
        // 브라우저도 제 나름대로 자리를 되돌리므로 한 프레임 뒤에 한 번 더 확인한다.
        raf = requestAnimationFrame(() => {
          if (Math.abs(window.scrollY - target) > 2) window.scrollTo(0, target);
        });
        return;
      }
      if (performance.now() - startedAt > RESTORE_WAIT_MS) return;
      raf = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, [target, scope]);
}
