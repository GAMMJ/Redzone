"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";

// 클라 인터랙션(매치 상세 펼치기·전적 페이지 이동)이 TanStack Query를 쓰므로
// 루트에서 한 번만 감싼다. SEO 페이지의 데이터는 여전히 서버 컴포넌트가 가져온다.
export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
