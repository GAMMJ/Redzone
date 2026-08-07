"use client";

import { ArrowRight, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import { PLATFORMS, PLATFORM_LABEL, PLATFORM_ICON } from "@/lib/constants";
import type { Platform } from "@/lib/constants";

interface SearchBarProps {
  platform: Platform;
  onPlatformChange: (platform: Platform) => void;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  onFocus?: () => void;
}

const PLATFORM_OPTIONS = PLATFORMS.map((value) => ({
  value,
  label: PLATFORM_LABEL[value],
  icon: PLATFORM_ICON[value],
}));

export default function SearchBar({
  platform,
  onPlatformChange,
  value,
  onChange,
  onSubmit,
  placeholder = "플레이어 닉네임을 입력하세요",
  onFocus,
}: SearchBarProps) {
  return (
    <form
      aria-label="플레이어 검색"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex h-[66px] w-full max-w-[720px] items-center gap-2 rounded-lg border-2 border-hairline-strong bg-surface p-2 shadow-md transition-colors has-[input:focus]:border-primary"
    >
      <div className="w-[150px] shrink-0">
        <Dropdown<Platform>
          options={PLATFORM_OPTIONS}
          value={platform}
          onChange={onPlatformChange}
        />
      </div>

      <div className="flex flex-1 items-center gap-2.5 px-2.5">
        <Search className="h-[19px] w-[19px] shrink-0 text-text-tertiary" />
        <input
          aria-label="플레이어 닉네임"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>

      <Button type="submit" size="lg" icon={ArrowRight} iconPosition="right" className="h-full w-[130px]">
        검색
      </Button>
    </form>
  );
}
