import Tag from "@/components/ui/Tag";

interface NewsCardProps {
  category: string;
  date: string;
  title: string;
}

// 메인 뉴스 카드 — 썸네일 자리 + 카테고리/날짜 + 제목 (이미지 에셋 미확보라 플레이스홀더)
export default function NewsCard({ category, date, title }: NewsCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface shadow-xs transition-shadow hover:shadow-sm">
      <div className="aspect-[16/10] w-full bg-surface-muted" />
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2.5">
          <Tag>{category}</Tag>
          <span className="text-xs text-text-tertiary">{date}</span>
        </div>
        <h3 className="text-sm font-semibold leading-normal text-text-primary">{title}</h3>
      </div>
    </article>
  );
}
