"use client";

import { useEffect, useState } from "react";
import { forgetStored, isFresh, readStored, writeStored } from "@/lib/viewRestore";

interface Envelope {
  at: number;
  value: unknown;
}

/**
 * 적어 둔 봉투를 연다. 형태가 아니거나 너무 오래됐으면 `null`.
 *
 * 값을 그대로 돌려주지 않고 감싸서 돌려주는 이유는, `unknown | null`은 TypeScript가
 * `unknown`으로 접어버려 애노테이션이 의도만 적고 컴파일러는 아무것도 안 하기 때문이다.
 * 감싸 두면 "봉투가 없음"과 "값이 null"이 타입 위에서 갈린다.
 */
function openEnvelope(raw: unknown): { value: unknown } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { at, value } = raw as Record<string, unknown>;
  if (!isFresh(at)) return null;
  return { value };
}

/**
 * 링크를 눌러 다른 화면으로 갔다가 **떠난 지 얼마 안 돼 다시 들어오면** 되살아나는 상태.
 *
 * 대개는 뒤로 온 경우다. 다만 "뒤로 왔다"를 정확히 가려내지는 못한다 — 남의 프로필에서
 * 검색으로 이 사람에게 새로(앞으로 가기로) 들어와도 되살아난다. 방향 대신 시간으로 자르므로
 * 한참 뒤에 되살아나는 것만 막는다(`RESTORE_MAX_AGE_MS`).
 *
 * 되살리면서 **곧바로 지운다.** 그래서 새로고침에는 남지 않는다 — 이게 이 훅의 요점이다.
 *
 * 주소(쿼리)에 담는 방법도 있지만 그러면 새로고침해도 남는다. 펼쳐 둔 카드가 그대로
 * 열린 채 뜨고, 상세를 다시 불러오느라 PUBG 호출까지 쓴다. 새로고침은 "처음부터 다시"라는
 * 뜻이므로 그때는 접혀 있어야 한다.
 *
 * 적어 두는 것은 `rememberReturnState`가 맡는다. 화면을 떠나는 링크를 누를 때 부른다.
 *
 * `sessionStorage`를 쓰므로 탭 단위이고 창을 닫으면 사라진다.
 *
 * @param parse 적어 둔 것을 그대로 믿지 않고 형태를 확인한다. 배포로 형태가 바뀐 뒤
 *   옛 세션이 남아 있으면 엉뚱한 값이 상태로 들어가, 어느 탭도 선택되지 않은 화면 같은
 *   조용한 오작동이 된다. 아니다 싶으면 `null`을 돌려주면 처음 상태로 남는다.
 */
export function useReturnState<T>(key: string, initial: T, parse: (raw: unknown) => T | null) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const storageKey = `return:${key}`;

    // 읽기와 지우기를 모두 이 안에서 한다.
    //
    // 밖에서 먼저 읽고 지우면 개발 모드에서 값을 잃는다. StrictMode는 effect를 두 번 돌리는데,
    // 첫 번째가 값을 지우고 예약한 뒤 정리 단계에서 취소당하고, 두 번째는 읽을 것이 없다.
    //
    // 되살리기를 첫 그림 뒤로 미루는 이유는 따로 있다. 렌더 중에 상태를 바꾸면 린트가 막고,
    // 하이드레이션이 끝나기 전에 바꾸면 서버가 그려 보낸 것과 어긋난다.
    const id = requestAnimationFrame(() => {
      const raw = readStored(storageKey);
      if (raw === null) return;
      forgetStored(storageKey);

      try {
        const opened = openEnvelope(JSON.parse(raw));
        if (opened === null) return;
        const restored = parse(opened.value);
        if (restored !== null) setValue(restored);
      } catch {
        // 형식이 깨졌으면 그냥 처음 상태로 둔다.
      }
    });
    return () => cancelAnimationFrame(id);
    // parse는 매 렌더 새로 만들어질 수 있어 deps에 넣지 않는다. 되살리기는 key당 한 번이면 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setValue] as const;
}

/**
 * 지금 상태를 적어 둔다. 화면을 떠나는 링크를 누를 때 부른다.
 *
 * 스크롤할 때마다, 혹은 상태가 바뀔 때마다 적지 않는 이유는 그 사이에 화면이 걷히며
 * 생기는 값들이 섞여 들어오기 때문이다. 누르는 순간의 상태가 곧 돌아와야 할 상태다.
 */
export function rememberReturnState(key: string, value: unknown): void {
  // 적은 시각을 같이 넣는다. 뒤로 오지 않아 남은 기록이 한참 뒤에 되살아나지 않게 한다.
  const envelope: Envelope = { at: Date.now(), value };
  writeStored(`return:${key}`, JSON.stringify(envelope));
}
