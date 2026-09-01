import NewsCard from "./NewsCard";
import LoadFailure from "@/components/ui/LoadFailure";
import { getNews } from "@/lib/steam/news";

/**
 * 뉴스 카드 세 장. 조회를 여기 가둬 두고 섹션 헤더는 밖에서 먼저 그린다.
 *
 * 못 불러왔다고 홈 전체를 끌고 내려가지 않는다. Hero도 실시간 랭킹도 뉴스와 무관하게
 * 멀쩡하니, 실패는 이 자리에서만 말한다. `inline`이라 섹션 제목 아래 한 줄로 눕는다 —
 * 가운데 정렬 블록을 놓으면 홈이 통째로 죽은 것처럼 보인다.
 */
export default async function NewsCards() {
  const items = await getNews();

  if (!items) {
    return (
      <div className="rounded-lg border border-hairline bg-surface px-5 py-4">
        <LoadFailure inline message="뉴스를 불러오지 못했습니다" />
      </div>
    );
  }

  // 못 불러온 것과 보여줄 게 없는 것을 가려 말한다. 스팀이 멀쩡히 답했는데 최근 목록이
  // 전부 대회 중계 안내라 뽑을 글이 없는 경우다. 여기에 "다시 시도"를 놓으면 눌러도
  // 같은 화면이 나온다 — 고장이 아니기 때문이다.
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-surface px-5 py-4">
        <p className="text-caption text-text-tertiary">최근 올라온 공지가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {items.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
