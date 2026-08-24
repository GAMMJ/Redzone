"use client";

import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// 루트 레이아웃 자체가 깨졌을 때만 쓰인다. 이때는 layout.tsx가 렌더되지 않으므로
// html·body를 여기서 직접 그려야 하고, Header·Footer도 기대할 수 없다.
// 그래서 공용 컴포넌트에 기대지 않고 토큰 클래스만으로 최소한의 화면을 만든다.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-text-primary">페이지를 표시할 수 없습니다</h1>
          <p className="text-caption text-text-secondary">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 새로고침해 주세요.
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          다시 시도
        </button>

        {error.digest && <p className="text-xs text-text-tertiary">오류 코드 {error.digest}</p>}
      </body>
    </html>
  );
}
