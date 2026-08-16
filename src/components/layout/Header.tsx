"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/layout/Container";
import PlayerSearchBox from "@/components/search/PlayerSearchBox";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "홈", href: "/" },
  { label: "랭킹", href: "/ranking" },
  { label: "통계", href: "/stats" },
  { label: "뉴스", href: "/news" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-hairline bg-surface">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-primary font-mono text-[15px] font-bold text-primary-foreground">
              R
            </span>
            <span className="font-display text-[17px] font-bold text-text-primary">
              레드존
            </span>
          </Link>

          <nav className="flex items-center gap-7">
            {NAV_ITEMS.map((item) => {
              // 홈('/')은 모든 경로의 접두사라 정확 매칭해야 다른 페이지에서 active가 유지되지 않음
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm ${
                    isActive
                      ? "font-semibold text-text-primary"
                      : "font-medium text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <PlayerSearchBox variant="compact" />
      </Container>
    </header>
  );
}
