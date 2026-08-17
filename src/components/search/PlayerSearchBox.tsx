"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import RecentSearches from "@/components/search/RecentSearches";
import { PLATFORMS, PLATFORM_LABEL, PLATFORM_ICON } from "@/lib/constants";
import type { Platform } from "@/lib/constants";
import { usePlayerSearchBox } from "@/hooks/usePlayerSearchBox";

type SearchVariant = "hero" | "compact";

interface VariantStyle {
  wrapper: string; // relative 래퍼 폭 — 드롭다운이 이 폭을 채운다
  form: string;
  dropdownWidth: string;
  dropdownSize: "sm" | "md";
  showCheck: boolean;
  optionIcon: boolean; // 드롭다운 옵션에 플랫폼 아이콘 노출 여부
  iconClass: string;
  inputWrap: string;
  inputText: string;
  placeholder: string;
  button: boolean;
}

// hero=메인(큰 테두리+검색버튼), compact=헤더(작은 테두리, 버튼 없음)
const VARIANT: Record<SearchVariant, VariantStyle> = {
  hero: {
    wrapper: "w-full max-w-[720px]",
    form: "h-[66px] w-full gap-2 border-2 border-hairline-strong bg-surface p-2 shadow-md has-[input:focus]:border-primary",
    dropdownWidth: "w-[150px]",
    dropdownSize: "md",
    showCheck: true,
    optionIcon: true,
    iconClass: "h-[19px] w-[19px]",
    inputWrap: "flex flex-1 items-center gap-2.5 px-2.5",
    inputText: "text-[15px]",
    placeholder: "플레이어 닉네임을 입력하세요",
    button: true,
  },
  compact: {
    wrapper: "w-80",
    form: "w-full gap-1.5 border border-hairline bg-surface-subtle py-1 pl-1.5 pr-3.5 focus-within:border-primary",
    dropdownWidth: "w-[86px]",
    dropdownSize: "sm",
    showCheck: false,
    optionIcon: false,
    iconClass: "h-4 w-4",
    inputWrap: "flex flex-1 items-center gap-1.5",
    inputText: "text-caption",
    placeholder: "플레이어 검색…",
    button: false,
  },
};

// 플레이어 검색창 — 메인(hero)·헤더(compact) 공통 컴포넌트.
// 상태·제출은 usePlayerSearchBox 훅으로 공유하고, 레이아웃 차이만 variant로 분기.
// 입력 포커스 시 최근 검색 드롭다운을 띄우고, 외부 클릭·Esc·항목 선택 시 닫는다.
export default function PlayerSearchBox({ variant }: { variant: SearchVariant }) {
  const { platform, setPlatform, query, setQuery, handleSubmit, searchWith } =
    usePlayerSearchBox();
  const s = VARIANT[variant];

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 검색창 바깥 클릭 시 최근 검색 드롭다운 닫기
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const options = PLATFORMS.map((value) => ({
    value,
    label: PLATFORM_LABEL[value],
    icon: s.optionIcon ? PLATFORM_ICON[value] : undefined,
  }));

  return (
    <div ref={wrapperRef} className={`relative ${s.wrapper}`}>
      <form
        aria-label="플레이어 검색"
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(false);
          handleSubmit();
        }}
        className={`flex items-center rounded-lg transition-colors ${s.form}`}
      >
        <div className={`${s.dropdownWidth} shrink-0`}>
          <Dropdown<Platform>
            options={options}
            value={platform}
            onChange={setPlatform}
            size={s.dropdownSize}
            showCheck={s.showCheck}
          />
        </div>

        <div className={s.inputWrap}>
          <Search className={`shrink-0 text-text-tertiary ${s.iconClass}`} />
          <input
            type="search"
            aria-label="플레이어 닉네임"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
            placeholder={s.placeholder}
            className={`w-full min-w-0 bg-transparent text-text-primary outline-none placeholder:text-text-tertiary ${s.inputText}`}
          />
        </div>

        {s.button && (
          <Button
            type="submit"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            className="h-full w-[130px]"
          >
            검색
          </Button>
        )}
      </form>

      {open && (
        <RecentSearches
          onSelect={(name, target) => {
            setOpen(false);
            searchWith(name, target);
          }}
        />
      )}
    </div>
  );
}
