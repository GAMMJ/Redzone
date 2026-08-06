import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "레드존 — PUBG 전적 분석",
  description: "PUBG API 기반 배틀그라운드 전적 분석 플랫폼",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-screen flex-col">
        {/* Pretendard 동적 서브셋(public/fonts) — unicode-range 서브셋 CSS라 next/font 대신 수동 링크(React 19가 head로 hoist) */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/fonts/pretendard.css" />
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
