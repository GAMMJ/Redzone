"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * 맨 위로 돌아가는 버튼. 긴 페이지에 붙인다.
 *
 * 처음부터 떠 있지 않다. 한 화면도 안 내려간 상태에서는 갈 곳이 위에 없어서, 가릴 것만 가린다.
 *
 * 기준을 고정 픽셀이 아니라 창 높이로 잡는다. 노트북과 세로로 긴 모니터에서 "한 화면 넘게
 * 내려갔다"의 실제 거리가 두 배 넘게 차이 나기 때문이다. 고정값을 쓰면 한쪽에서는 스크롤을
 * 조금만 굴려도 튀어나오고 다른 쪽에서는 한참 내려가야 나온다.
 */
function shouldShow(): boolean {
  return window.scrollY > window.innerHeight;
}

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // passive라 스크롤을 막지 않는다. 값이 그대로면 React가 리렌더를 건너뛰므로,
    // 스크롤 한 번에 상태가 실제로 바뀌는 것은 문턱을 넘나들 때뿐이다.
    const sync = () => setVisible(shouldShow());
    sync(); // 새로고침으로 중간에서 시작하는 경우
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="맨 위로"
      onClick={() => {
        // 움직임을 줄여 달라고 한 사람에게는 미끄러뜨리지 않는다. 긴 페이지에서 화면이
        // 길게 흐르는 것은 어지럼증을 부르는 대표적인 움직임이다.
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
        // 맨 위에 닿으면 이 버튼은 사라진다. 초점은 자연히 문서 처음으로 돌아가므로
        // 키보드로 누른 사람도 Tab을 이어가면 위에서부터 훑게 된다.
      }}
      // 화면 오른쪽 아래에 붙박이로 둔다(fixed). 랭킹 표의 고정 헤더가 z-10이라 그보다 위,
      // 드롭다운(z-50)보다는 아래다. 44px은 손가락이 닿는 최소 크기.
      //
      // 색·모서리·초점 링은 Button의 primary와 같은 값을 쓴다. 여기서만 다른 주황을 쓰거나
      // 모서리를 달리 굴리면 같은 사이트에서 버튼이 두 종류로 보인다.
      className="fixed right-6 bottom-6 z-30 flex h-11 w-11 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-md transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:right-10 lg:bottom-10"
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
