import { QueryClient, isServer } from "@tanstack/react-query";
import axios from "axios";
import { retryAfterMs } from "@/lib/rateLimit";

function statusOf(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
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
