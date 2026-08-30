import LoadFailure from "@/components/ui/LoadFailure";
import TopGames from "@/components/stats/TopGames";
import { getOnlinePlayers, PUBG_APP_ID } from "@/lib/steam/onlinePlayers";
import dayjs from "@/lib/dayjs";

/**
 * 동접자 탭 — 스팀 기준 현재 접속자.
 *
 * 폭을 720px로 묶어 같은 페이지의 안내 상자와 맞춘다. 컨테이너가 1440px까지 벌어지는데
 * 숫자 두 개짜리 화면이 그 폭을 다 쓰면 가운데가 텅 빈다.
 */
export default async function OnlinePlayers() {
  const online = await getOnlinePlayers();

  if (!online) {
    return (
      <div className="mx-auto w-full max-w-[720px] rounded-lg border border-hairline bg-surface">
        <LoadFailure message="접속자 수를 불러오지 못했습니다" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-5 rounded-lg border border-hairline bg-surface p-10 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-caption text-text-tertiary">지금 게임 중</span>
          <p className="flex items-baseline gap-1">
            <span className="font-mono text-display font-bold text-text-primary">
              {online.pubg.count.toLocaleString()}
            </span>
            <span className="text-body text-text-secondary">명</span>
          </p>
        </div>

        {/* 숫자 하나만 있으면 그게 많은 건지 적은 건지 알 수 없다. 이 줄이 스케일을 준다. */}
        <p className="rounded-pill bg-primary-soft px-3 py-1 text-caption font-semibold text-text-primary">
          스팀 전체 {online.pubg.rank}위
        </p>

        {/* 안 적으면 실시간으로 읽힌다. 스팀이 5분 간격으로 갱신하고 우리가 5분 더 캐시하므로
            최대 10분까지 늦을 수 있다. 그리고 이 숫자는 영원히 스팀 PC뿐이다 —
            PUBG API에는 접속자 엔드포인트가 없어 카카오·콘솔은 셀 방법이 없다. */}
        <p className="text-[11px] text-text-tertiary">
          스팀 PC 기준 · {relativeToNow(online.updatedAt)} 집계
        </p>
      </div>

      <TopGames rows={online.top} highlightAppId={PUBG_APP_ID} />
    </div>
  );
}

/**
 * "8분 전".
 *
 * 시각을 그대로 찍지 않는다. 서버가 렌더하므로 절대 시각을 쓰면 배포 서버의 시간대(UTC)가
 * 그대로 나가 한국 사용자에게 아홉 시간 어긋난 시계를 보여 준다. 얼마나 묵었는지는
 * 시간대와 무관하고, 여기서 알려 주려는 것도 그쪽이다.
 */
function relativeToNow(unixSeconds: number): string {
  // 스팀과 우리 서버의 시계가 몇 초 어긋나면 "몇 초 후 집계"가 된다. 미래는 지금으로 접는다.
  return dayjs(Math.min(unixSeconds * 1000, Date.now())).fromNow();
}
