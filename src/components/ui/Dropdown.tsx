"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";
import type { UISize } from "./types";

interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: LucideIcon;
}

interface DropdownProps<T extends string = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  icon?: LucideIcon;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  size?: UISize;
  // 선택 항목 옆 체크 아이콘 노출 여부 (좁은 영역에서 끄고 배경색만으로 선택 표시)
  showCheck?: boolean;
  // 옵션이 이 개수를 넘으면 목록을 스크롤(스크롤바 숨김) + 하단 페이드·화살표로 "더 있음" 표시
  maxVisible?: number;
}

const SIZE: Record<UISize, { trigger: string; text: string; icon: string; option: string }> = {
  sm: { trigger: "py-2 px-3", text: "text-xs", icon: "h-3.5 w-3.5", option: "py-1.5 px-3" },
  md: { trigger: "py-2.5 px-[14px]", text: "text-sm", icon: "h-4 w-4", option: "py-2 px-[14px]" },
  lg: { trigger: "py-3 px-4", text: "text-base", icon: "h-[18px] w-[18px]", option: "py-2.5 px-4" },
};

export default function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  icon: Icon,
  placeholder = "선택",
  disabled = false,
  error = false,
  size = "md",
  showCheck = true,
  maxVisible,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  // 키보드 내비게이션 하이라이트 인덱스 (-1 = 없음)
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const s = SIZE[size];

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selected = options.find((option) => option.value === value);

  // disabled 옵션을 건너뛰고 다음 활성 인덱스를 찾는다 (없으면 from 유지)
  function nextEnabled(from: number, dir: 1 | -1) {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) {
      if (!options[i].disabled) return i;
    }
    return from;
  }

  // 열 때 현재 선택(또는 첫 활성) 항목을 하이라이트 시작점으로
  function openMenu() {
    setOpen(true);
    const selectedIndex = options.findIndex((option) => option.value === value);
    setFocusedIndex(
      selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : nextEnabled(-1, 1),
    );
  }

  // 옵션이 maxVisible를 넘으면 스크롤 목록 + 하단 "더 있음" 힌트 표시
  const overflowing = maxVisible != null && options.length > maxVisible;

  // 스크롤이 목록 바닥에 닿았는지 판별 — 닿으면 하단 "더보기" 힌트를 숨긴다 (1px 여유)
  const updateScrollHint = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= 1);
  }, []);

  useEffect(() => {
    updateScrollHint();
  }, [open, options.length, updateScrollHint]);

  // 키보드로 이동한 하이라이트 항목을 스크롤 영역 안으로
  useEffect(() => {
    if (!open || focusedIndex < 0) return;
    document.getElementById(`${listId}-opt-${focusedIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [open, focusedIndex, listId]);

  const showScrollHint = overflowing && !atBottom;

  const selectOption = useCallback(
    (option: DropdownOption<T>) => {
      if (option.disabled) return;
      onChange(option.value);
      setOpen(false);
    },
    [onChange],
  );

  // 트리거 키보드 조작 — ↑/↓ 이동, Enter 선택, Esc 닫기
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      if (open) {
        event.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      setFocusedIndex((prev) => nextEnabled(prev, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return;
      setFocusedIndex((prev) => nextEnabled(prev, -1));
    } else if (event.key === "Enter" && open && focusedIndex >= 0) {
      event.preventDefault();
      const option = options[focusedIndex];
      if (option) selectOption(option);
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        // 포커스가 드롭다운 바깥으로 나가면 닫는다 (Tab 등)
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-activedescendant={
          open && focusedIndex >= 0 ? `${listId}-opt-${focusedIndex}` : undefined
        }
        className={`flex w-full items-center justify-between gap-2 rounded-md border-2 bg-surface transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none ${s.trigger} ${
          error
            ? "border-danger"
            : open
              ? "border-primary"
              : "border-hairline-strong hover:border-text-tertiary focus-visible:border-primary"
        }`}
      >
        {/* min-w-0가 없으면 글자가 안 줄어들어 트리거 밖으로 삐져나가고, 옆에 붙은 검색창까지
            밀어낸다. flex 자식은 기본이 min-width:auto라 내용보다 작아지지 않는다.
            폭은 호출부가 정하므로(검색창은 86px), 긴 라벨은 여기서 잘라 낸다. */}
        <span className="flex min-w-0 items-center gap-2">
          {(() => {
            const TriggerIcon = selected?.icon ?? Icon;
            return TriggerIcon ? (
              <TriggerIcon className={`shrink-0 text-text-secondary ${s.icon}`} />
            ) : null;
          })()}
          <span
            className={`truncate font-medium ${s.text} ${selected ? "text-text-primary" : "text-text-tertiary"}`}
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`shrink-0 text-text-secondary transition-transform ${s.icon} ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-md border border-hairline-strong bg-surface shadow-md">
          <div className="relative">
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              onScroll={updateScrollHint}
              className={`p-1.5 ${
                overflowing
                  ? "max-h-[180px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  : ""
              }`}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isFocused = focusedIndex === index;
                const OptionIcon = option.icon;
                return (
                  <li key={option.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      id={`${listId}-opt-${index}`}
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onClick={() => selectOption(option)}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={`flex w-full items-center justify-between gap-2 rounded-md text-left font-medium transition-colors ${s.option} ${s.text} ${
                        option.disabled ? "opacity-50 pointer-events-none" : ""
                      } ${
                        isSelected
                          ? "bg-primary-soft text-primary"
                          : `text-text-primary hover:bg-surface-subtle ${isFocused ? "bg-surface-subtle" : ""}`
                      }`}
                    >
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        {OptionIcon && <OptionIcon className={`shrink-0 ${s.icon}`} />}
                        {option.label}
                      </span>
                      {showCheck && isSelected && <Check className={`shrink-0 ${s.icon}`} />}
                    </button>
                  </li>
                );
              })}
              {options.length === 0 && (
                <li role="presentation" className={`text-text-tertiary ${s.option} ${s.text}`}>
                  항목이 없습니다
                </li>
              )}
            </ul>
            {/* 하단을 페이드·살짝 블러 처리하고 화살표로 더 있음을 암시. 바닥에 닿으면 숨김 */}
            {showScrollHint && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-9 items-end justify-center rounded-b-md bg-gradient-to-t from-surface via-surface/70 to-transparent backdrop-blur-[1px]">
                <ChevronDown className="mb-1 h-3.5 w-3.5 text-text-tertiary" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
