"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Platform } from "@/lib/constants";
import { playerPath } from "@/lib/paths";
import { useRecentSearchStore } from "@/store/recentSearchStore";

// 플레이어 검색 입력 상태 + 제출 로직 — Hero·헤더 검색이 공유.
// 제출/재검색 시 공백 트림 후 빈 값이면 무시, 아니면 기록 후 프로필로 이동.
/**
 * 검색 결과로 갈 곳. 기본은 전적 페이지다.
 *
 * 통계 페이지도 같은 검색창을 쓰는데 목적지가 다르다. 검색창을 통째로 복제하면 최근 검색·
 * 빈 값 안내·포커스 처리가 두 벌이 되어 한쪽만 고쳐 어긋난다.
 */
export type SearchDestination = (platform: Platform, name: string) => string;

export function usePlayerSearchBox(
  initialPlatform: Platform = "steam",
  destination: SearchDestination = playerPath,
) {
  const router = useRouter();
  const addRecent = useRecentSearchStore((state) => state.add);
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [query, setQuery] = useState("");

  // 빈 입력으로 눌렀을 때 아무 일도 안 일어나면 사용자는 검색이 고장 난 것으로 본다.
  // 왜 안 되는지 말해 주고, 호출부가 입력란에 초점을 돌려줄 수 있게 결과를 알려 준다.
  const [error, setError] = useState<string | null>(null);

  // 지정한 닉네임+플랫폼으로 검색 — 최근 검색 항목 클릭 재검색에도 재사용
  // @returns 실제로 이동했는가
  function searchWith(name: string, target: Platform): boolean {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("닉네임을 입력해 주세요");
      return false;
    }
    setError(null);
    // 존재 여부는 이동해 봐야 알 수 있다(조회가 곧 이동이다). 없는 닉네임이면 프로필의
    // not-found 화면이 이 기록을 도로 지운다 — 오타가 목록에 남지 않게.
    addRecent(trimmed, target);
    router.push(destination(target, trimmed));
    return true;
  }

  function handleSubmit(): boolean {
    return searchWith(query, platform);
  }

  // 다시 입력하기 시작하면 안내를 지운다. 고치는 중에 빨간 글씨가 남아 있으면 거슬린다.
  function changeQuery(next: string) {
    setQuery(next);
    if (error) setError(null);
  }

  return {
    platform,
    setPlatform,
    query,
    setQuery: changeQuery,
    error,
    handleSubmit,
    searchWith,
  };
}
