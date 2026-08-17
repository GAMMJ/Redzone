"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Platform } from "@/lib/constants";
import { playerPath } from "@/lib/paths";
import { useRecentSearchStore } from "@/store/recentSearchStore";

// 플레이어 검색 입력 상태 + 제출 로직 — Hero·헤더 검색이 공유.
// 제출/재검색 시 공백 트림 후 빈 값이면 무시, 아니면 기록 후 프로필로 이동.
export function usePlayerSearchBox(initialPlatform: Platform = "steam") {
  const router = useRouter();
  const addRecent = useRecentSearchStore((state) => state.add);
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [query, setQuery] = useState("");

  // 지정한 닉네임+플랫폼으로 검색 — 최근 검색 항목 클릭 재검색에도 재사용
  function searchWith(name: string, target: Platform) {
    const trimmed = name.trim();
    if (!trimmed) return;
    addRecent(trimmed, target);
    router.push(playerPath(target, trimmed));
  }

  function handleSubmit() {
    searchWith(query, platform);
  }

  return { platform, setPlatform, query, setQuery, handleSubmit, searchWith };
}
