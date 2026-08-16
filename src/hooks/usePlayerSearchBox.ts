"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Platform } from "@/lib/constants";
import { playerPath } from "@/lib/paths";

// 플레이어 검색 입력 상태 + 제출 로직 — Hero·헤더 검색이 공유.
// 제출 시 공백 트림 후 빈 값이면 무시, 아니면 프로필로 이동.
export function usePlayerSearchBox(initialPlatform: Platform = "steam") {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [query, setQuery] = useState("");

  function handleSubmit() {
    const name = query.trim();
    if (!name) return;
    router.push(playerPath(platform, name));
  }

  return { platform, setPlatform, query, setQuery, handleSubmit };
}
