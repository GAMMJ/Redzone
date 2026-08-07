import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import ProfileHeader from "@/components/player/ProfileHeader";
import { getPlayerByName, getCurrentSeasonId, getPlayerRanked } from "@/lib/pubg/records";
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

// 닉네임 → id → 현재 시즌 → 스쿼드 랭크(없으면 스쿼드 1인칭). 플레이어 없으면 null.
async function loadProfile(platform: string, rawName: string) {
  const name = decodeName(rawName);
  const player = await getPlayerByName(platform, name);
  if (!player) return null;
  const seasonId = await getCurrentSeasonId(platform);
  const ranked = seasonId ? await getPlayerRanked(platform, player.id, seasonId) : {};
  return { player, squadRanked: ranked.squad ?? ranked["squad-fpp"] };
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

  return (
    <Container className="flex flex-col gap-8 py-10">
      <ProfileHeader player={profile.player} platform={platform} rankedStat={profile.squadRanked} />
    </Container>
  );
}
