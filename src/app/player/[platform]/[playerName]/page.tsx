import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import LoadFailure from "@/components/ui/LoadFailure";
import ScrollToTop from "@/components/ui/ScrollToTop";
import ProfileHeader from "@/components/player/ProfileHeader";
import ModeStats from "@/components/player/ModeStats";
import RecentMatches from "@/components/player/RecentMatches";
import {
  getPlayerByName,
  getCurrentSeasonId,
  getPlayerRanked,
  getPlayerSeason,
  getPlayerMatchIds,
  getMatchSummaries,
} from "@/lib/pubg/records";
import { isValidShard } from "@/lib/pubgProxy";
import { failureMessage, isRateLimited } from "@/lib/rateLimit";
import { RECENT_MATCHES_PAGE_SIZE } from "@/lib/pubg/matchConstants";

interface PageParams {
  platform: string;
  playerName: string;
}

// Next가 params를 이미 디코드하지만, 이름에 %가 포함되거나 잘못된 인코딩이면 재디코딩이 던질 수 있어 방어
function decodeName(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

// 닉네임 → id → 현재 시즌 → 모드별 랭크·일반전 스탯 + 최근 전적 첫 페이지. 플레이어 없으면 null.
async function loadProfile(platform: string, rawName: string) {
  const name = decodeName(rawName);
  // 시즌 목록은 플레이어와 무관 + 30분 캐시(전 플레이어 공유)라 병렬로 당겨 TTFB를 줄인다.
  const [player, season] = await Promise.all([
    getPlayerByName(platform, name),
    getCurrentSeasonId(platform),
  ]);
  if (!player) return null;

  // 매치 ID는 플레이어 응답에 딸려 온다 — PUBG엔 매치 목록 엔드포인트가 따로 없다.
  const matchIds = getPlayerMatchIds(player);

  // 시즌 스탯과 전적 첫 페이지는 서로를 기다릴 이유가 없어 함께 당긴다.
  // 시즌 조회가 실패해도 전적은 그대로 나온다 — 다만 스탯 쪽은 "없음"이 아니라 "못 불러옴"이
  // 되어야 하므로, 시즌을 통째로 넘겨 실패가 그대로 전해지게 한다.
  const [ranked, seasonStats, matchSummaries] = await Promise.all([
    getPlayerRanked(platform, player.id, season),
    getPlayerSeason(platform, player.id, season),
    getMatchSummaries(platform, player.id, matchIds.slice(0, RECENT_MATCHES_PAGE_SIZE)),
  ]);

  return { player, ranked, seasonStats, matchIds, matchSummaries };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { playerName } = await params;
  const name = decodeName(playerName);
  const title = `${name} 전적 · 레드존`;
  const description = `${name}님의 PUBG 시즌 티어·전적을 확인하세요.`;
  return { title, description, openGraph: { title, description } };
}

export default async function PlayerProfilePage({ params }: { params: Promise<PageParams> }) {
  const { platform, playerName } = await params;
  if (!isValidShard(platform)) notFound();

  // 한도 초과는 오류 경계로 넘기지 않는다.
  //
  // 서버에서 난 오류는 digest만 클라로 내려오고 응답 헤더는 오지 않아, 오류 화면에서는
  // 몇 초 뒤에 되는지 알 수 없다. 여기서는 Retry-After가 손에 있으니 그 자리에서 말해 준다.
  // 분당 10회 한도(프로필 한 번에 4콜)라 이 실패가 가장 흔하다.
  let profile: Awaited<ReturnType<typeof loadProfile>>;
  try {
    profile = await loadProfile(platform, playerName);
  } catch (err) {
    if (!isRateLimited(err)) throw err;
    return (
      <Container className="py-20">
        <LoadFailure message={failureMessage(err, "전적")} />
      </Container>
    );
  }
  if (!profile) notFound();

  // 헤더 티어는 스쿼드 TPP 기준(없으면 스쿼드 1인칭)
  const squadRanked = profile.ranked.data.squad ?? profile.ranked.data["squad-fpp"];

  return (
    <Container className="flex flex-col gap-8 py-10">
      <ProfileHeader
        player={profile.player}
        platform={platform}
        rankedStat={squadRanked}
        // 갱신을 눌렀을 때 결과가 실패였는지 버튼이 알아야 대기를 걸지 말지 정할 수 있다.
        loadFailed={profile.ranked.failed || profile.seasonStats.failed}
      />
      <ModeStats
        ranked={profile.ranked.data}
        season={profile.seasonStats.data}
        rankedFailed={profile.ranked.failed}
        seasonFailed={profile.seasonStats.failed}
      />
      <RecentMatches
        shard={platform}
        playerId={profile.player.id}
        matchIds={profile.matchIds}
        initialSummaries={profile.matchSummaries}
      />
      {/* 매치를 더 불러올수록 길어지고, 카드를 펼치면 더 길어진다 */}
      <ScrollToTop />
    </Container>
  );
}
