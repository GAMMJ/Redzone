/**
 * 키보드 포커스 링 — 사이트 전체가 한 벌을 쓴다.
 *
 * 버튼·링크·카드에 각각 적어 두면 한 곳만 손봐도 링 굵기나 색이 갈린다. 포커스 표시는
 * 키보드로만 다니는 사람에게 "지금 내가 어디 있는지"의 전부라, 자리마다 다르게 보이면
 * 그 자체로 길을 잃는다.
 *
 * `rounded-sm`이 같이 붙는다. 링은 요소 모양을 따라가므로 모서리 값이 없으면 각진 링이
 * 둥근 요소를 감싼다. 더 둥근 요소는 뒤에 자기 `rounded-*`를 덧붙여 덮으면 된다.
 */
export const FOCUS_RING =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
