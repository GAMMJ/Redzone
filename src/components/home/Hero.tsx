"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import SearchBar from "@/components/layout/SearchBar";
import type { Platform } from "@/lib/constants";
import { playerPath } from "@/lib/paths";

// 메인 히어로 — 소개 + 검색(닉네임 입력 → 프로필로 이동). 최근검색·시즌 배지 데이터는 이후.
export default function Hero() {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("steam");
  const [query, setQuery] = useState("");

  function handleSubmit() {
    const name = query.trim();
    if (!name) return;
    router.push(playerPath(platform, name));
  }

  return (
    <section className="flex flex-col items-center bg-surface px-6 pt-20 pb-20">
      <Badge status="online">실시간 전적 분석</Badge>

      <h1 className="mt-6 text-center font-display text-[44px] font-bold leading-[1.15] text-text-primary">
        PUBG 전적을 한눈에.
      </h1>
      <p className="mt-4 max-w-xl text-center text-base text-text-secondary">
        닉네임만 입력하면 랭크 전적, 매치 기록, 시즌 추이까지 — 깔끔하고 빠르게 확인하세요.
      </p>

      <div className="mt-8 w-full max-w-[720px]">
        <SearchBar
          platform={platform}
          onPlatformChange={setPlatform}
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
