"use client";

import { Clock, X } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { PLATFORM_LABEL } from "@/lib/constants";
import type { Platform } from "@/lib/constants";
import { useRecentSearchStore } from "@/store/recentSearchStore";

interface RecentSearchesProps {
  // 항목 클릭 시 재검색 — 부모(PlayerSearchBox)가 이동·닫힘을 처리
  onSelect: (name: string, platform: Platform) => void;
}

// 검색창 포커스 시 뜨는 최근 검색 드롭다운 — 스토어(localStorage) 구독.
// 폭·위치는 부모의 relative 래퍼에 맞춰 inset-x-0로 채운다.
export default function RecentSearches({ onSelect }: RecentSearchesProps) {
  const items = useRecentSearchStore((state) => state.items);
  const remove = useRecentSearchStore((state) => state.remove);
  const clear = useRecentSearchStore((state) => state.clear);

  return (
    <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-hairline bg-surface shadow-md">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <span className="text-caption font-semibold text-text-secondary">최근 검색</span>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-caption text-text-tertiary transition-colors hover:text-text-primary"
          >
            전체 삭제
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-caption text-text-tertiary">
          최근 검색 기록이 없습니다
        </p>
      ) : (
        <ul>
          {items.map((item) => (
            <li
              key={`${item.platform}:${item.name}`}
              className="flex items-center border-b border-hairline transition-colors last:border-b-0 hover:bg-surface-subtle"
            >
              <button
                type="button"
                onClick={() => onSelect(item.name, item.platform)}
                className="flex min-w-0 flex-1 items-center gap-2.5 px-4 py-2.5 text-left"
              >
                <Clock className="h-4 w-4 shrink-0 text-text-tertiary" />
                <span className="min-w-0 truncate text-sm font-medium text-text-primary">
                  {item.name}
                </span>
                <span className="shrink-0 text-caption text-text-tertiary">
                  {PLATFORM_LABEL[item.platform]}
                </span>
                <span className="ml-auto shrink-0 text-caption text-text-tertiary">
                  {dayjs(item.searchedAt).fromNow()}
                </span>
              </button>
              <button
                type="button"
                aria-label={`${item.name} 최근 검색 삭제`}
                onClick={() => remove(item.name, item.platform)}
                className="shrink-0 px-3 py-2.5 text-text-tertiary transition-colors hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
