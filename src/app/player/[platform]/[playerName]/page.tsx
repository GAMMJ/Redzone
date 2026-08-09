import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import ProfileHeader from "@/components/player/ProfileHeader";
import ModeStats from "@/components/player/ModeStats";
import {
  getPlayerByName,
  getCurrentSeasonId,
  getPlayerRanked,
  getPlayerSeason,
} from "@/lib/pubg/records";
import { isValidShard } from "@/lib/pubgProxy";

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

// 닉네임 → id → 현재 시즌 → 모드별 랭크·일반전 스탯. 플레이어 없으면 null.
async function loadProfile(platform: string, rawName: string) {
  const name = decodeName(rawName);
  // 시즌 목록은 플레이어와 무관 + 30분 캐시(전 플레이어 공유)라 병렬로 당겨 TTFB를 줄인다.
  const [player, seasonId] = await Promise.all([
    getPlayerByName(platform, name),
    getCurrentSeasonId(platform),
  ]);
  if (!player) return null;
  if (!seasonId) return { player, ranked: {}, season: {} };
  const [ranked, season] = await Promise.all([
    getPlayerRanked(platform, player.id, seasonId),
    getPlayerSeason(platform, player.id, seasonId),
  ]);
  return { player, ranked, season };
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
    </Container>
  );
}
