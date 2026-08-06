import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

// 사이트 좌우 폭 정렬의 단일 소스. 헤더·푸터·본문 섹션이 공유한다.
// 폭·패딩을 바꾸려면 여기 한 곳만 고치면 전역 반영된다.
export default function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-[1440px] px-6 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}
