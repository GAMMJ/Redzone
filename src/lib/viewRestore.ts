// 화면을 떠났다 뒤로 왔을 때 자리를 되살리는 데 필요한 것들.
//
// 문서 스크롤·표 안 스크롤·펼친 카드가 각각 다른 곳에서 되살아나지만 규칙은 하나다.
// 규칙이 갈라지면 한쪽만 고쳐 어긋나므로 여기 모아 둔다.

/**
 * 문서나 목록이 자랄 때까지 기다리는 한도.
 *
 * 상세는 카드를 펼친 뒤에 조회하므로 되살리는 시점에는 아직 짧다. 한 프레임으로는 어림도 없다.
 * 그렇다고 끝내 안 자라면(조회 실패·느린 응답) 붙잡고 있어 봐야 소용없어서 이 선에서 손을 뗀다.
 *
 * 2초는 콜드 조회(1~3초)를 다 덮지 못한다. 그래도 늘리지 않는 이유는, 뒤로 오는 길은 거의
 * 언제나 캐시 히트(QueryClient는 브라우저 싱글턴, staleTime 5분)라 이 한도에 닿지 않고,
 * 늘린 만큼 붙잡는 시간이 길어져 사람이 스크롤을 잡을 여지와 부딪히기 때문이다.
 * 콜드 경로에서 못 맞추는 것은 알고 받아들인 트레이드오프다.
 *
 * 자리를 되살릴 때와 누른 것을 붙잡을 때 모두 이 값을 쓴다 — 기다리는 이유가 같다.
 */
export const RESTORE_WAIT_MS = 2000;

/** 수식 키가 눌린 클릭에서 보는 것만 추린 모양. React 이벤트와 DOM 이벤트 둘 다 들어맞는다. */
interface ClickModifiers {
  button: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/**
 * 새 탭·새 창으로 열리는 클릭인가.
 *
 * 이런 클릭은 링크를 눌러도 이 화면이 그대로 남는다. 그때 자리를 적어 두면 떠나지도 않았는데
 * 기록만 남아, 나중에 새로고침할 때 되살아난다. 주소에 담는 방식을 되물린 바로 그 증상이다.
 */
export function opensElsewhere(event: ClickModifiers): boolean {
  return event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
}

/**
 * 적어 둔 자리가 쓸모 있는 시간.
 *
 * 키는 **읽을 때** 지워진다. 그래서 나갔다가 뒤로 오지 않으면 남는다 — 남의 프로필에서
 * 검색으로 이 사람에게 새로 들어오면(뒤로가 아니라 앞으로 가기) 남아 있던 기록이 소비되어,
 * 누르지도 않은 카드가 펼쳐진 채 뜬다. 주소에 담는 방식을 되물린 바로 그 증상이다.
 *
 * "뒤로 왔다"를 정확히 알아낼 방법이 마땅치 않아, 대신 시간으로 자른다. 방향을 가려내지는
 * 못하고 "한참 뒤"만 걸러낸다.
 *
 * 5분인 이유는 두 실패의 무게가 다르기 때문이다. 너무 길면 카드가 펼쳐진 채 떠도 눈에 보이고
 * 한 번 누르면 닫힌다. 너무 짧으면 기능이 조용히 안 되고, 사용자는 원인도 방법도 알 수 없다.
 * 이 기능의 시나리오가 "남의 전적을 **보고** 돌아온다"라 1분은 정상적인 왕복에도 모자란다.
 *
 * 펼친 카드와 표 안 스크롤이 모두 이 값을 쓴다 — 한쪽만 자르면 카드는 접힌 채 뜨는데
 * 그 매치를 다시 펼쳤을 때 표만 옛 자리에서 열린다.
 */
export const RESTORE_MAX_AGE_MS = 5 * 60_000;

/** 적어 둔 시각이 아직 쓸모 있는가. 형태가 아니거나 너무 오래됐으면 거짓. */
export function isFresh(at: unknown): boolean {
  if (typeof at !== "number" || !Number.isFinite(at)) return false;
  return Date.now() - at <= RESTORE_MAX_AGE_MS;
}

/** 사람이 스크롤을 잡았다는 신호. 브라우저가 스스로 하는 조정은 이 이벤트를 내지 않는다. */
const USER_SCROLL_EVENTS = ["wheel", "touchmove", "keydown"] as const;

let anchorRaf = 0;
/** 도는 고정을 끊는다. 루프와 리스너를 함께 잡고 있어야 다음 호출에서 통째로 정리된다. */
let releaseAnchor: (() => void) | null = null;

/**
 * 누른 것이 화면에서 움직이지 않게 붙잡는다.
 *
 * **문서(window) 스크롤 전용이다.** 되돌릴 때 `window.scrollBy`를 쓰고, 도는 루프를
 * 모듈 하나로 관리한다 — 만지는 자원이 하나뿐이라 그렇다. 다른 스크롤 상자 안의 요소를
 * 붙잡아야 한다면 이 함수가 아니라 그 상자를 미는 별도의 것이 필요하다.
 *
 * 매치 카드는 한 번에 한 장만 펼치므로, 아래쪽 카드를 누르면 위에서 펼쳐져 있던 카드가
 * 접히며 그 높이만큼 목록이 위로 당겨진다. 방금 누른 카드가 화면 밖으로 달아난다.
 * 위쪽 카드를 누를 때는 접히는 것이 눌린 것보다 아래라 티가 나지 않는다.
 *
 * 누르기 직전 자리를 재 두었다가, 다시 그려진 뒤 어긋난 만큼 창을 밀어 되돌린다.
 * 펼쳐지며 늘어나는 높이는 누른 카드 **아래**로 붙으므로 이 자리에 영향을 주지 않는다.
 */
export function keepAnchored(element: HTMLElement): void {
  // 앞선 클릭의 루프를 먼저 끊는다. 이게 없으면 루프 두 개가 동시에 돈다.
  //
  // 루프는 RESTORE_WAIT_MS 동안 살아 있으므로, 그 안에 다른 카드를 누르면 앞 카드를 붙잡던
  // 루프가 아직 돈다. 그런데 그 루프에게는 방금 펼쳐진 상세가 "자기 위에 끼어든 높이"라
  // 그만큼 창을 밀어 앞 카드를 제자리로 되돌린다 — 방금 누른 카드는 화면 밖으로 밀려난다.
  // 아래 `expectedY` 가드는 이걸 못 막는다. 자기 scrollBy 뒤에 expectedY를 갱신하므로
  // 자기가 만든 스크롤에는 걸리지 않고, 먼저 등록된 쪽(= 오래된 루프)이 이긴다.
  releaseAnchor?.();

  const before = element.getBoundingClientRect().top;
  const startedAt = performance.now();

  // 한 프레임 뒤에 한 번 맞추는 것으로는 모자란다.
  //
  // 접히는 쪽은 즉시 사라지지만 펼쳐지는 쪽 상세는 조회가 끝나야 높이가 찬다. 게다가 로그 탭은
  // 지도까지 그려 아주 길어서, 그런 카드가 접히면 문서가 확 짧아지며 브라우저가 스크롤을 강제로
  // 줄인다. 그 순간에는 되돌릴 공간이 없다 — 잠시 뒤 문서가 다시 길어졌을 때라야 맞출 수 있다.
  //
  // 그래서 잠깐 지켜보며 어긋난 만큼 되돌린다. 사람이 스크롤을 잡으면 그 즉시 손을 뗀다.
  // 사람이 스크롤을 잡았는지는 **입력**으로 판단한다. 스크롤 좌표가 변한 것으로 추측하면 안 된다.
  //
  // 긴 카드가 접히면 문서가 짧아지면서 브라우저가 스크롤을 강제로 줄이고, 새 상세가 도착해
  // 문서가 다시 길어지면 되돌린다. 좌표로 판단하면 이 강제 조정을 사람이 한 것으로 오해해
  // **첫 프레임에 손을 떼 버린다.** 고정이 가장 필요한 바로 그 상황이 곧 포기 조건이 되는 셈이다.
  // (실측: 문서 3529→2684로 줄며 스크롤이 2067→1734로 잘렸고, 그 한 번으로 고정이 죽어
  //  누른 카드가 959px 밀려났다.)
  //
  // 휠·터치·키는 사람만 만든다. 브라우저의 클램프나 스크롤 앵커링은 이 이벤트를 내지 않는다.
  const release = () => {
    cancelAnimationFrame(anchorRaf);
    for (const type of USER_SCROLL_EVENTS) window.removeEventListener(type, release, true);
    releaseAnchor = null;
  };
  for (const type of USER_SCROLL_EVENTS) window.addEventListener(type, release, true);
  releaseAnchor = release;

  const fix = () => {
    // 화면에서 떨어져 나간 뒤에도 돌면 남의 화면을 민다. 분리된 노드의 좌표는 전부 0이라
    // drift가 -before로 고정되고 스스로는 영영 멈추지 않는다.
    if (!element.isConnected) return release();

    const drift = element.getBoundingClientRect().top - before;
    if (Math.abs(drift) > 1) window.scrollBy(0, drift);

    if (performance.now() - startedAt < RESTORE_WAIT_MS) anchorRaf = requestAnimationFrame(fix);
    else release();
  };
  anchorRaf = requestAnimationFrame(fix);
}

// sessionStorage는 사생활 보호 모드나 저장소 차단 설정에서 접근만 해도 예외를 던진다.
//
// 특히 적어 두는 쪽이 위험하다. 링크 클릭을 가로채는 자리에서 불리는데 거기서 예외가 새면
// React가 이벤트 전달을 멈춰, Link가 SPA 전환을 놓치고 전체 페이지 이동으로 떨어진다.
// 되살리기를 못 하는 것과 이동이 굼떠지는 것은 무게가 다르다.

export function readStored(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // 적어 두지 못하면 되살리지 못할 뿐이다.
  }
}

export function forgetStored(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // 위와 같다.
  }
}
