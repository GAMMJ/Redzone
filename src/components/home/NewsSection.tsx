import { ArrowRight } from "lucide-react";
import NewsCard from "./NewsCard";
import LinkButton from "@/components/ui/LinkButton";
import { NEWS_ITEMS } from "@/lib/mock/home";

// 메인 "최신 PUBG 뉴스" 섹션 — 헤더 + 카드 3열
export default function NewsSection() {
  return (
    <section>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-bold text-text-primary">최신 PUBG 뉴스</h2>
          <span className="text-caption text-text-tertiary">패치 노트, e스포츠, 시즌 소식</span>
        </div>
        <LinkButton icon={ArrowRight} className="transition-opacity hover:opacity-80">
          전체 뉴스
        </LinkButton>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {NEWS_ITEMS.map((item) => (
          <NewsCard key={item.title} category={item.category} date={item.date} title={item.title} />
        ))}
      </div>
    </section>
  );
}
