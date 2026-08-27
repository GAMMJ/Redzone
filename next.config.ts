import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 중 왼쪽 아래에 뜨는 라우트 표시기를 숨긴다.
  // 화면 구석을 가려서 확인에 방해가 된다. 끄더라도 컴파일·런타임 에러는 그대로 뜬다.
  devIndicators: false,
};

export default nextConfig;
