import { Suspense } from "react";
import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import PlayerSearchBox from "@/components/search/PlayerSearchBox";
import LoadFailure from "@/components/ui/LoadFailure";
import StatsTabs, { parseTab } from "@/components/stats/StatsTabs";
import PersonalStats, { parseMode } from "@/components/stats/PersonalStats";
import PersonalStatsSkeleton from "@/components/stats/PersonalStatsSkeleton";
import OnlinePlayers from "@/components/stats/OnlinePlayers";
import {
  getPlayerIdByName,
  getLifetime,
  getWeaponMastery,
  getSurvivalMastery,
} from "@/lib/pubg/records";
import { isValidShard } from "@/lib/pubgProxy";
import { failureMessage, isRateLimited } from "@/lib/rateLimit";
import { statsPath } from "@/lib/paths";
import { PLATFORM_LABEL, isPlatform, type GameMode } from "@/lib/constants";

// 조회 결과를 매 요청 렌더한다(업스트림은 Redis 캐시로 보호). 빌드 타임 PUBG 호출 방지.
export const dynamic = "force-dynamic";

interface StatsSearchParams {
  player?: string;
  platform?: string;
  tab?: string;
  mode?: string;
}

export const metadata: Metadata = {
  title: "PUBG 통계 | 레드존",
  description: "닉네임으로 통산 기록·무기 숙련도·생존 레벨을 확인하세요.",
};

/**
 * 닉네임 → id → 통산·무기·생존.
 *
 * 세 조회는 서로를 기다릴 이유가 없어 함께 당긴다. 하나가 실패해도 나머지는 그대로 나온다
 * — 각 조회가 실패 여부를 함께 들고 내려오므로 화면이 "없음"과 "못 불러옴"을 가려 말한다.
 *
 * 한 번에 PUBG 호출 4회다(닉네임 조회 + 3종). 분당 한도가 10회라 캐시 TTL이 중요하다
 * (playerConstants.ts 참고).
 */
async function loadStats(platform: string, name: string) {
  const player = await getPlayerIdByName(platform, name);
  if (!player) return null;

  const [lifetime, weapons, survival] = await Promise.all([
    getLifetime(platform, player.id),
    getWeaponMastery(platform, player.id),
    getSurvivalMastery(platform, player.id),
  ]);
  return { player, lifetime, weapons, survival };
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<StatsSearchParams>;
}) {
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const mode = parseMode(params.mode);
  // 값이 **없을 때만** 기본값을 준다. 이상한 값은 그대로 흘려보내 아래 `isValidShard` 분기가 받는다.
  //
  // 예전에는 모르는 값도 "steam"으로 접었는데, 그러면 조용히 다른 플랫폼을 조회한다.
  // 지원이 끊긴 `console` 링크로 들어오면 "Steam · {닉네임}"이라고 단정하게 되고,
  // 그 닉네임을 쓰는 Steam 계정이 실제로 있으면 **남의 전적이 그 사람 것처럼 뜬다.**
  // 접는 쪽이 안전해 보이지만, 틀린 답을 자신 있게 말하는 것이 못 찾는 것보다 나쁘다.
  const platform = params.platform ?? "steam";
  const name = (params.player ?? "").trim();

  // 탭·모드를 바꿔도 검색한 사람은 유지한다
  const hrefFor = (next: string) => statsPath(platform, name, next, mode);
  const hrefForMode = (next: string) => statsPath(platform, name, tab, next);

  return (
    <Container className="flex flex-col gap-10 py-10">
      {/* 제목·탭·검색창은 한 덩어리로 가운데 모은다.
          컨테이너가 1440px까지 벌어지는데 왼쪽에 붙여 두면 검색창만 덩그러니 떠 보인다.
          결과(StatsBody)는 표가 있어 그대로 폭을 다 쓴다. */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-text-primary">통계</h1>
          <p className="text-center text-caption text-text-secondary">
            닉네임으로 통산 기록·무기 숙련도·생존 레벨을 확인하세요.
          </p>
        </div>

        {/* 탭이 둘뿐이라 폭을 풀어 두면 버튼 하나가 화면 절반이 된다 */}
        <div className="w-full max-w-[360px]">
          <StatsTabs current={tab} hrefFor={hrefFor} />
        </div>

        {/* 통계만 보러 온 사람이 프로필을 거치지 않아도 되게 자체 검색창을 둔다 */}
        {tab !== "online" && <PlayerSearchBox variant="hero" to="stats" />}
      </div>

      {tab === "online" ? (
        // 개인 통계와 달리 검색어가 없어 탭을 열자마자 조회가 시작된다.
        // 스팀 호출 한 번(캐시 5분)이라 대개 금방이지만, 느릴 때 빈 자리가 남지 않게 감싼다.
        <Suspense fallback={<OnlineLoading />}>
          <OnlinePlayers />
        </Suspense>
      ) : !name ? (
        <Notice>
          <p className="text-caption text-text-tertiary">닉네임을 검색하면 통계가 나옵니다</p>
        </Notice>
      ) : !isValidShard(platform) ? (
        <Notice>
          <p className="text-caption text-text-tertiary">지원하지 않는 플랫폼입니다</p>
        </Notice>
      ) : (
        // 조회를 Suspense 안에 두어 기다리는 동안 뼈대를 보여 준다.
        //
        // 이 페이지 한 번이 PUBG 호출 4회라 몇 초가 걸린다. 그동안 화면이 그대로면 사용자는
        // 검색이 안 먹은 줄 알고 다시 누르고, 그만큼 호출을 또 쓴다.
        //
        // key에 조회를 가르는 값을 전부 넣는다. 넣지 않으면 같은 경로 안에서 검색어나 모드만
        // 바뀔 때 경계가 그대로라 뼈대가 다시 뜨지 않는다 — 랭킹이 platform을 key로 쓰는 것과
        // 같은 이유다. 검색 전 안내는 여기 밖에 둔다. 안 그러면 아직 검색도 안 했는데
        // 뼈대가 한 번 번쩍인다.
        <Suspense key={`${platform}:${name}:${mode}`} fallback={<StatsLoading />}>
          <StatsBody platform={platform} name={name} mode={mode} hrefForMode={hrefForMode} />
        </Suspense>
      )}
    </Container>
  );
}

/**
 * 결과 자리에 들어가는 안내 상자.
 *
 * 폭을 검색창에 맞춰 두는 게 요점이다. 결과 표는 1440px를 다 쓰지만, 아직 아무것도 없을 때
 * 그 폭짜리 빈 상자가 뜨면 위의 가운데 정렬과 따로 논다.
 */
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[720px] rounded-lg border border-hairline bg-surface p-10 text-center">
      {children}
    </div>
  );
}

/** 동접자를 기다리는 동안. 숫자 두 개짜리 화면이라 상자와 자리만 잡아 둔다. */
function OnlineLoading() {
  return (
    <div
      role="status"
      aria-label="접속자 수 불러오는 중"
      className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-5 rounded-lg border border-hairline bg-surface p-10"
    >
      <span className="block h-10 w-48 animate-pulse rounded-sm bg-hairline" />
      <span className="block h-6 w-28 animate-pulse rounded-pill bg-hairline" />
    </div>
  );
}

/** 기다리는 동안. 이름 자리는 결과에서 오므로 여기서는 뼈대만 잡는다. */
function StatsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <span className="block h-6 w-40 animate-pulse rounded-sm bg-hairline" />
      <PersonalStatsSkeleton />
    </div>
  );
}

// 없는 닉네임 · 한도 초과 · 정상을 각각 다르게 말한다.
// 검색 전·잘못된 플랫폼은 조회가 필요 없어 호출부에서 먼저 가른다.
async function StatsBody({
  platform,
  name,
  mode,
  hrefForMode,
}: {
  platform: string;
  name: string;
  mode: GameMode;
  hrefForMode: (mode: GameMode) => string;
}) {
  // 한도 초과는 오류 경계로 넘기지 않는다 — 서버 오류는 digest만 내려와 몇 초 뒤에 되는지
  // 알 수 없다. 여기서는 Retry-After가 손에 있으니 그 자리에서 말해 준다.
  let result: Awaited<ReturnType<typeof loadStats>>;
  try {
    result = await loadStats(platform, name);
  } catch (err) {
    if (!isRateLimited(err)) throw err;
    return (
      <div className="mx-auto w-full max-w-[720px] rounded-lg border border-hairline bg-surface">
        <LoadFailure message={failureMessage(err, "통계")} />
      </div>
    );
  }

  if (!result) {
    return (
      <Notice>
        <p className="text-caption text-text-secondary">
          <span className="font-medium text-text-primary">
            {isPlatform(platform) ? PLATFORM_LABEL[platform] : platform} · {name}
          </span>
          <span> 에 해당하는 전적이 없습니다</span>
        </p>
        <p className="mt-2 text-[11px] text-text-tertiary">
          PUBG는 대소문자를 구분합니다. 플랫폼도 확인해 주세요.
        </p>
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-text-primary">{result.player.attributes.name}</h2>
      <PersonalStats
        lifetime={result.lifetime}
        weapons={result.weapons}
        survival={result.survival}
        mode={mode}
        hrefForMode={hrefForMode}
      />
    </div>
  );
}
