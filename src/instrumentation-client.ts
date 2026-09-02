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
       * 세션 리플레이. 사용자 화면 조작을 그대로 되감아 본다.
       *
       * 처음엔 "스크립트가 무거워진다"며 꺼 뒀는데, 재 보니 그 걱정은 근거가 약했다.
       * 녹화기(`recorder.js`, 123KB)는 `lazy-recorder`로 **따로 떨어져 있어 초기 번들에
       * 섞이지 않는다.** 녹화가 시작될 때 받는다. 첫 로딩은 그대로다.
       *
       * 남는 비용은 이벤트와 **별개인 무료 한도**다. 지금은 방문자가 사실상 없어 문제가
       * 되지 않고, 오히려 이 단계에서 제일 값나가는 도구다 — 어디서 막히는지 미리 알아맞혀
       * 이벤트를 심을 필요 없이 그냥 보면 된다.
       *
       * 개발 환경에서도 켜 둔다. 아직 배포 전이라 여기서 끄면 볼 수 있는 녹화가 하나도
       * 없다. 나중에 개발 트래픽이 한도를 갉아먹기 시작하면 그때 막으면 된다.
       */
      disable_session_recording: false,

      session_recording: {
        /**
         * 입력값 가리기. **기본값이 이미 `true`라 동작은 같다.** 그래도 적어 둔다 —
         * 여기 값이 대시보드의 "Privacy and masking" 설정을 이기므로, 적어 두면 누가
         * 대시보드에서 풀어도 계속 가려진다. `disable_session_recording`을 코드에 뒀던 것과
         * 같은 이유다.
         *
         * 화면에 **그려진** 닉네임까지 가리지는 않는다(그건 `maskTextSelector`의 몫).
         * 가릴 이유도 없다 — 닉네임은 이미 주소에 있고, 그 주소는 페이지뷰마다
         * `$current_url`로 올라간다. 여기만 가려 봐야 가린 척이 된다.
         */
        maskAllInputs: true,
      },
    });
  } catch {
    // 애널리틱스가 실패해도 사이트는 계속 돈다. 이 파일의 예외는 화면까지 올라간다.
  }
}
