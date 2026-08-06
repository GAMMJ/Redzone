// lucide-react에 브랜드 아이콘이 없어 의미가 가까운 범용 아이콘으로 대체
import { Bird, Code, Play } from "lucide-react";
import Container from "@/components/layout/Container";

interface FooterColumn {
  title: string;
  links: string[];
}

const FOOTER_COLUMNS: FooterColumn[] = [
  { title: "서비스", links: ["플레이어 검색", "랭킹", "통계", "시즌 보상"] },
  { title: "리소스", links: ["뉴스", "패치 노트", "API 문서", "고객지원"] },
  { title: "회사", links: ["서비스 소개", "개인정보처리방침", "이용약관", "문의하기"] },
];

const SOCIAL_ICONS = [
  { id: "twitter", Icon: Bird },
  { id: "github", Icon: Code },
  { id: "youtube", Icon: Play },
];

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
              <span className="font-display text-base font-bold text-text-primary">
                레드존
              </span>
            </div>
            <p className="mt-3 w-[280px] text-caption leading-normal text-text-tertiary">
              PUBG API 기반 배틀그라운드 전적 분석 플랫폼
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="flex w-[180px] flex-col gap-3">
              <span className="text-caption font-semibold text-text-primary">
                {column.title}
              </span>
              {column.links.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-caption font-normal text-text-secondary hover:text-text-primary"
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-hairline pt-5">
          <span className="text-xs text-text-tertiary">
            © 2026 레드존 · KRAFTON, Inc.와 무관한 비공식 서비스입니다.
          </span>
          <div className="flex items-center gap-4">
            {SOCIAL_ICONS.map(({ id, Icon }) => (
              <a
                key={id}
                href="#"
                className="text-text-tertiary hover:text-text-secondary"
              >
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
