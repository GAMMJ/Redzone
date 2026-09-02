// 의도적으로 남기는 이벤트.
//
// 클릭·입력은 PostHog의 autocapture가 알아서 잡는다. 여기 적는 것은 **자동으로는 알 수 없는
// 것**뿐이다 — 결과(찾았나 못 찾았나, 막혔나)와, 클릭만 봐서는 맥락을 모르는 동작.
//
// 자동으로 잡히는 걸 또 적으면 같은 일이 두 벌로 남아, 나중에 숫자가 어긋날 때 어느 쪽이
// 맞는지 알 수 없게 된다.
import posthog from "posthog-js";

/**
 * 이벤트 이름. 여기 없는 이름은 못 보낸다.
 *
 * 문자열을 아무 데서나 지어 쓰면 오타 하나가 새 이벤트가 되고, 대시보드에서 둘로 갈린 뒤에야
 * 알아차린다. 타입이 먼저 막게 한다.
 */
export type AnalyticsEvent =
  /** 닉네임을 검색했다. 어느 플랫폼으로 얼마나 찾는지 — 콘솔을 살린 게 실제로 쓰이는지 본다. */
  | "player_searched"
  /** 검색했는데 없었다. 오타율과 대소문자 안내가 듣는지 본다. */
  | "player_not_found"
  /** PUBG 분당 10회 한도에 막혔다. **한도 상향 신청의 근거가 되는 값이다.** */
  | "rate_limited";

/**
 * 이벤트 하나를 보낸다. 실패해도 화면에 영향을 주지 않는다.
 *
 * 닉네임은 넣지 않는다. 공개된 게임 핸들이긴 하지만 애널리틱스에 쌓을 이유가 없고,
 * 넣는 순간 "누가 누구를 찾아봤나"가 남는다. 우리가 알고 싶은 건 횟수와 비율이다.
 */
export function track(event: AnalyticsEvent, properties?: Record<string, string | number>): void {
  try {
    posthog.capture(event, properties);
  } catch {
    // 애널리틱스가 기능을 막지 않는다
  }
}
