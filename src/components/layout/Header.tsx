"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";
import Container from "@/components/layout/Container";
import PlayerSearchBox from "@/components/search/PlayerSearchBox";
import { PUBG_NEWS_URL, isExternalHref } from "@/lib/paths";

interface NavItem {
  label: string;
  href: string;
}

// 뉴스는 우리가 만드는 페이지가 아니라 배그 공식 사이트다. 우리는 홈에서 최신 몇 건만
// 추려 보여줄 뿐이고, 뉴스를 통째로 옮겨 싣지 않는다 — Footer의 리소스 쪽과 같은 판단이다.
const NAV_ITEMS: NavItem[] = [
  { label: "홈", href: "/" },
  { label: "랭킹", href: "/ranking" },
  { label: "통계", href: "/stats" },
  { label: "뉴스", href: PUBG_NEWS_URL },
];


export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-hairline bg-surface">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            {/* 로고는 어두운 카드를 통째로 구운 PNG다. 사이트 배경이 흰색이라 밝은 배경으로는
                마크가 배경에 묻힌다. `next/image`는 쓰지 않는다(CLAUDE.md) — 128px짜리를
                28px로 줄여 쓰므로 고해상도 화면에서도 또렷하고, width/height로 CLS를 막는다. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo.png" alt="" width={28} height={28} className="shrink-0" />
            <span className="font-display text-[17px] font-bold text-text-primary">
              레드존
            </span>
          </Link>

          <nav className="flex items-center gap-7">
            {NAV_ITEMS.map((item) => {
              const external = isExternalHref(item.href);
              // 홈('/')은 모든 경로의 접두사라 정확 매칭해야 다른 페이지에서 active가 유지되지 않음
              // 외부 링크는 우리 경로가 아니므로 어떤 페이지에서도 active가 되지 않는다.
              const isActive =
                !external &&
                (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));

              const className = `text-sm ${
                isActive
                  ? "font-semibold text-text-primary"
                  : "font-medium text-text-secondary hover:text-text-primary"
              }`;

              // 외부 주소는 <Link>로 감싸도 결국 <a>다. 라우터를 태우지 않는다.
              //
              // 아이콘과 aria-label로 "여기서 나간다"를 알린다. 이 항목만 새 탭으로 열리는데
              // 겉모습이 옆의 홈·랭킹과 똑같으면, 누르는 사람은 같은 사이트 안에서 움직이는
              // 줄 안다. 화면 낭독기 쪽은 아이콘이 안 보이므로 이름에 직접 적어 준다.
              return external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.label} (새 탭에서 열림)`}
                  className={`${className} inline-flex items-center gap-0.5`}
                >
                  {item.label}
                  <ArrowUpRight aria-hidden className="h-3.5 w-3.5 shrink-0" />
                </a>
              ) : (
                <Link key={item.href} href={item.href} className={className}>
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
