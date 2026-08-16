import Badge from "@/components/ui/Badge";
import PlayerSearchBox from "@/components/search/PlayerSearchBox";

interface HeroProps {
  // 현재 시즌 번호(서버에서 조회해 전달). 없으면 기본 문구로 degrade.
  seasonNumber: number | null;
}

// 메인 히어로 — 소개 + 검색(닉네임 입력 → 프로필로 이동). 검색은 자기완결형 클라 컴포넌트라 Hero는 서버 컴포넌트.
export default function Hero({ seasonNumber }: HeroProps) {
  return (
    <section className="flex flex-col items-center bg-surface px-6 pt-20 pb-20">
      <Badge status="online">
        {seasonNumber ? `시즌 ${seasonNumber} · 진행 중` : "실시간 전적 분석"}
      </Badge>

      <h1 className="mt-6 text-center font-display text-[44px] font-bold leading-[1.15] text-text-primary">
        PUBG 전적을 한눈에.
      </h1>
      <p className="mt-4 max-w-xl text-center text-base text-text-secondary">
        닉네임만 입력하면 랭크 전적, 매치 기록, 시즌 추이까지 — 깔끔하고 빠르게 확인하세요.
      </p>

      <div className="mt-8 w-full max-w-[720px]">
        <PlayerSearchBox variant="hero" />
      </div>
    </section>
  );
}
