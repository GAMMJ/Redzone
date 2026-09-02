// PostHog 애널리틱스.
//
// `instrumentation-client`는 Next가 여는 자리다 — HTML을 다 받은 뒤, React 하이드레이션
// **전에** 돈다. Provider로 감싸는 방식보다 가볍고, 하이드레이션 전에 붙으므로 첫 페이지뷰를
// 놓치지 않는다. (Next 15.3부터. 이 프로젝트는 16.3)
//
// Next가 여기 초기화 시간을 재서 16ms를 넘으면 경고한다. 무거운 걸 얹지 말 것.
import posthog from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

// 키가 없으면 조용히 넘어간다. 로컬에서 `.env`를 안 채웠거나 미리보기 배포에 값을 안 넣은
// 경우인데, 그때 화면이 죽으면 애널리틱스가 서비스를 인질로 잡는 셈이 된다.
if (token) {
  try {
    posthog.init(token, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,

      /**
       * 권장 설정 묶음. 날짜는 판 번호처럼 쓰인다 — 이 날짜 이후로 바뀐 기본값이 적용된다.
       *
       * 두 가지를 얻는다.
       *
       * **`capture_pageview: "history_change"`** — History API를 보고 페이지뷰를 잡는다.
       * App Router의 클라이언트 이동도 그대로 잡힌다(실측: 홈 → 랭킹 → 통계가 각각 도착지
       * URL로 1건씩). 그래서 `onRouterTransitionStart` 훅을 두지 않는다 — 두면 한 번 이동이
       * 두 번 집계된다.
       *
       * **`internal_or_test_user_hostname`** — localhost·127.0.0.1을 test 사용자로 표시해
       * 개발 트래픽이 실제 방문자 수에 안 섞이게 한다.
       */
      defaults: "2026-05-30",

      /**
       * 세션 리플레이는 코드에서 못 켜게 막는다.
       *
       * 사용자 화면 조작을 통째로 기록하는 기능이라 스크립트가 무거워지고(CLAUDE.md 성능
       * 규칙) 무료 한도도 따로 쓴다. 대시보드 토글로도 켜지는 기능이라, 여기서 꺼 두면
       * 누가 무심코 켜도 실제로 녹화되지 않는다.
       */
      disable_session_recording: true,
    });
  } catch {
    // 애널리틱스가 실패해도 사이트는 계속 돈다. 이 파일의 예외는 화면까지 올라간다.
  }
}
