import Link from "next/link";
import Container from "@/components/layout/Container";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

// 갈 곳이 없는 링크는 두지 않는다. 눌러도 아무 일도 안 나는 링크는 없느니만 못하다.
//
// 리소스 쪽은 우리가 만드는 게 아니라 PUBG 공식 문서다. 뉴스·패치 노트를 우리가 옮겨
// 적을 이유가 없고, 옮기면 원본이 바뀔 때마다 뒤처진다.
const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "서비스",
    links: [
      { label: "플레이어 검색", href: "/" },
      { label: "랭킹", href: "/ranking" },
      { label: "통계", href: "/stats" },
    ],
  },
  {
    title: "리소스",
    links: [
      { label: "뉴스", href: "https://pubg.com/ko/news" },
      { label: "패치 노트", href: "https://pubg.com/ko/news?category=patch_notes" },
      { label: "API 문서", href: "https://documentation.pubg.com/" },
    ],
  },
];

const LINK_CLASS = "text-caption font-normal text-text-secondary hover:text-text-primary";

/**
 * 주소만 보고 안팎을 가른다.
 *
 * 따로 플래그를 두면 링크를 더할 때마다 둘을 맞춰 줘야 하고, 어긋나면 사이트 안을
 * 새 탭으로 열거나 바깥을 라우터로 넘기게 된다.
 */
function FooterLinkItem({ label, href }: FooterLink) {
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={LINK_CLASS}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={LINK_CLASS}>
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <Container className="flex flex-col gap-7 pt-12 pb-8">
        <div className="flex flex-wrap justify-between gap-8">
          <div className="w-[300px]">
            <div className="flex items-center gap-2">
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-primary font-mono text-sm font-bold text-primary-foreground">
                R
              </span>
              <span className="font-display text-base font-bold text-text-primary">레드존</span>
            </div>
            <p className="mt-3 w-[280px] text-caption leading-normal text-text-tertiary">
              PUBG API 기반 배틀그라운드 전적 분석 플랫폼
            </p>
          </div>

          {/* 칸이 둘뿐이라 따로 흩어 두면 사이가 벌어진다 — 묶어서 오른쪽에 붙인다 */}
          <div className="flex gap-16">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title} className="flex w-[180px] flex-col gap-3">
                <span className="text-caption font-semibold text-text-primary">{column.title}</span>
                {column.links.map((link) => (
                  <FooterLinkItem key={link.label} {...link} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-hairline pt-5">
          <span className="text-xs text-text-tertiary">
            © 2026 레드존 · KRAFTON, Inc.와 무관한 비공식 서비스입니다.
          </span>
        </div>
      </Container>
    </footer>
  );
}
