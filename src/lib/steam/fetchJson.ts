import "server-only";

/**
 * 시간 제한을 걸고 JSON을 받는다. 실패·시간 초과·형태 불일치는 전부 null.
 *
 * 요점은 제한이 **본문 읽기까지 덮는다**는 것이다. `clearTimeout`을 `res.json()` 앞에서
 * 부르면 헤더만 받고 본문에서 멎는 응답을 못 막는다 — 그 경우 Node의 기본 본문 제한(5분)에
 * 걸릴 때까지 매달리고, 서버 컴포넌트 안이라 페이지가 통째로 멎는다.
 *
 * `finally`에서 끄는 것도 같은 이유다. `fetch`가 던지면 타이머가 남는다.
 */
export async function fetchJsonWithTimeout(url: string, timeout: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    // 유효기간은 Redis 한 곳에서만 센다. Next 데이터 캐시에까지 얹지 않는다.
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
