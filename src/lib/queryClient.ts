import { QueryClient, isServer } from "@tanstack/react-query";
import axios from "axios";

function statusOf(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

// Retry-After는 "초 단위 숫자"와 "HTTP-date" 두 형식이 허용된다(RFC 9110).
// 빈 문자열을 그냥 Number()에 넘기면 0이 되어 429 직후 즉시 재시도가 된다 — 먼저 걸러낸다.
// 값이 없거나 해석할 수 없으면 null을 돌려 호출부가 지수 백오프로 넘어가게 한다.
function retryAfterMs(error: unknown): number | null {
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

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 이 앱의 클라 조회 대상은 대부분 종료된 매치라 사실상 불변이다.
        // 넉넉한 staleTime으로 카드를 접었다 펴도 재요청하지 않게 한다.
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        // 잘못된 shard·id 같은 4xx는 다시 보내도 결과가 같다. 429만 예외로 한 번 더 시도한다.
        retry: (failureCount, error) => {
          const status = statusOf(error);
          if (status && status >= 400 && status < 500 && status !== 429) return false;
          return failureCount < 1;
        },
        // 429를 받고 곧바로 다시 쏘면 rate limit을 더 악화시킨다.
        // 프록시가 PUBG의 Retry-After를 그대로 넘겨주므로 그 값을 따른다.
        retryDelay: (attempt, error) => {
          // 서버가 알려준 대기 시간을 따르되 상한을 둔다. 상세 펼침은 대기 중 스피너만 도는데,
          // PUBG가 창 잔여 시간(최대 60초)을 그대로 주면 멈춘 것처럼 보인다. 폴백과 같은 30초로 맞춘다.
          const fromHeader = retryAfterMs(error);
          if (fromHeader !== null) return Math.min(fromHeader, 30_000);
          return Math.min(1000 * 2 ** attempt, 30_000);
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

// 서버에서는 요청마다 새 클라이언트를, 브라우저에서는 싱글턴을 쓴다.
// 서버에서 싱글턴을 쓰면 사용자끼리 캐시가 섞인다.
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
