"use client";

import { useEffect, useRef } from "react";
import { track, type AnalyticsEvent, type AnalyticsProperties } from "@/lib/analytics";

/**
 * 서버가 그린 결과를 이벤트로 남긴다.
 *
 * 한도 초과나 "찾을 수 없음" 같은 것은 클릭이 아니라 **결과**라, autocapture가 영영 못 본다.
 * 그렇다고 서버 컴포넌트에서 `posthog-js`를 부를 수는 없으니, 그 자리에 이 컴포넌트를 놓아
 * 브라우저에서 한 번 쏘게 한다.
 *
 * 화면에는 아무것도 안 그린다. 분석을 UI 컴포넌트 안에 심지 않으려고 따로 둔 것이다 —
 * `LoadFailure`에 이벤트 인자를 붙이기 시작하면 그 컴포넌트가 두 가지 일을 하게 된다.
 */
export default function TrackEvent({
  event,
  properties,
}: {
  event: AnalyticsEvent;
  properties?: AnalyticsProperties;
}) {
  // 한 번만 보낸다. React가 개발 모드에서 이펙트를 두 번 돌리므로 그대로 두면 숫자가 배가 된다.
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(event, properties);
    // properties는 렌더마다 새 객체라 의존성에 넣으면 매번 다시 돈다.
    // 어차피 한 번만 보내므로 마운트 시점의 값이면 충분하다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  return null;
}
