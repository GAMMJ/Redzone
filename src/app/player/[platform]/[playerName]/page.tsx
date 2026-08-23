import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
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
  const [player, seasonId] = await Promise.all([
    getPlayerByName(platform, name),
    getCurrentSeasonId(platform),
  ]);
  if (!player) return null;

  // 매치 ID는 플레이어 응답에 딸려 온다 — PUBG엔 매치 목록 엔드포인트가 따로 없다.
  const matchIds = getPlayerMatchIds(player);

  // 시즌 스탯과 전적 첫 페이지는 서로를 기다릴 이유가 없어 함께 당긴다.
  // 시즌 id가 없어도(조회 실패 등) 스탯 쪽이 알아서 빈 값으로 degrade하고 전적은 그대로 나온다.
  const [ranked, season, matchSummaries] = await Promise.all([
    getPlayerRanked(platform, player.id, seasonId),
    getPlayerSeason(platform, player.id, seasonId),
    getMatchSummaries(platform, player.id, matchIds.slice(0, RECENT_MATCHES_PAGE_SIZE)),
  ]);

  return { player, ranked, season, matchIds, matchSummaries };
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

  const profile = await loadProfile(platform, playerName);
  if (!profile) notFound();

  // 헤더 티어는 스쿼드 TPP 기준(없으면 스쿼드 1인칭)
  const squadRanked = profile.ranked.squad ?? profile.ranked["squad-fpp"];

  return (
    <Container className="flex flex-col gap-8 py-10">
      <ProfileHeader player={profile.player} platform={platform} rankedStat={squadRanked} />
      <ModeStats ranked={profile.ranked} season={profile.season} />
      <RecentMatches
        shard={platform}
        playerId={profile.player.id}
        matchIds={profile.matchIds}
        initialSummaries={profile.matchSummaries}
      />
    </Container>
  );
}
