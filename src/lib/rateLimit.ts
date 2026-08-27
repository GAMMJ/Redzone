import axios from "axios";

/**
 * 한도 초과(429)를 알아보고 "몇 초 뒤에 되는지"를 꺼낸다.
 *
 * 프록시(`pubgProxy`)는 PUBG가 준 `Retry-After`를 그대로, 없으면 reset 시각에서 환산해
 * 내려보낸다. 그런데 화면에서 그 값을 읽는 곳이 없어 지금까지 버려지고 있었다.
 * 분당 10회 한도(프로필 한 번 조회에 4콜)에서 429는 예외가 아니라 일상적인 경로라,
 * "잠시 후 다시"보다 "37초 후"가 훨씬 쓸모 있다.
 *
 * 서버(SSR)와 브라우저 양쪽에서 쓴다. 규칙이 갈라지면 같은 429가 화면마다 다르게 보인다.
 */

/** 한도 초과로 실패했는가. */
export function isRateLimited(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 429;
}

/**
 * 다시 시도할 수 있을 때까지 남은 밀리초. 모르면 `null`.
 *
 * `Retry-After`는 초 단위 숫자로도, HTTP 날짜로도 올 수 있다(RFC 9110). 우리 프록시는 초를
 * 쓰지만 PUBG가 준 값을 그대로 넘기는 경로가 있어 둘 다 받아 둔다.
 *
 * 빈 문자열을 그냥 `Number()`에 넘기면 0이 되어 429 직후 즉시 재시도가 된다 — 먼저 걸러낸다.
 *
 * 재시도 간격(queryClient)과 화면 문구가 같은 값을 봐야 한다. 갈라지면 "37초 후"라고 써 놓고
 * 다른 때에 다시 쏘는 일이 생긴다.
 */
export function retryAfterMs(error: unknown): number | null {
  if (!axios.isAxiosError(error)) return null;
  const raw = error.response?.headers?.["retry-after"];
  if (typeof raw === "number") return Math.max(0, raw) * 1000;
  if (typeof raw !== "string" || raw.trim() === "") return null;

  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds) * 1000;

  const at = Date.parse(raw);
  if (Number.isFinite(at)) return Math.max(0, at - Date.now());

  return null;
}

/** 사람에게 말할 때 쓰는 남은 초. 0 이하이거나 모르면 `null`(= 시간을 말하지 않는다). */
export function retryAfterSeconds(error: unknown): number | null {
  const ms = retryAfterMs(error);
  if (ms === null || ms <= 0) return null;
  return Math.ceil(ms / 1000);
}

/**
 * 목적격 조사를 고른다 — 받침이 있으면 "을", 없으면 "를".
 *
 * "매치 상세을(를)"처럼 괄호로 둘 다 적으면 화면에서 그대로 읽힌다. 한글 음절은
 * 유니코드에서 초성·중성·종성이 규칙적으로 배열돼 있어, 28로 나눈 나머지가 0이면 받침이 없다.
 */
function objectParticle(word: string): string {
  const last = word.charCodeAt(word.length - 1);
  // 한글 음절 영역 밖(영문·숫자 등)이면 기본값을 쓴다
  if (Number.isNaN(last) || last < 0xac00 || last > 0xd7a3) return "를";
  return (last - 0xac00) % 28 === 0 ? "를" : "을";
}

/**
 * 실패를 사용자에게 할 말로 바꾼다.
 *
 * 한도 초과는 기다리면 풀리는 실패라 다른 실패와 할 말이 다르다 — 몇 초 뒤에 되는지 알면
 * 무작정 다시 누르지 않는다.
 *
 * @param subject 무엇을 못 불러왔는지 ("매치 상세")
 */
export function failureMessage(error: unknown, subject: string): string {
  if (!isRateLimited(error)) return `${subject}${objectParticle(subject)} 불러오지 못했습니다.`;
  const seconds = retryAfterSeconds(error);
  return seconds === null
    ? `조회 한도를 넘었습니다. 잠시 후 다시 시도해 주세요.`
    : `조회 한도를 넘었습니다. ${seconds}초 후 다시 시도해 주세요.`;
}
