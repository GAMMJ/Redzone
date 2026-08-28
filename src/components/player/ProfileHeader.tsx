import Avatar from "@/components/ui/Avatar";
import UpdateButton from "@/components/player/UpdateButton";
import TierBadge from "@/components/ui/TierBadge";
import { PLATFORM_LABEL, PLATFORM_ICON, isPlatform } from "@/lib/constants";
import type { Player, RankedGameModeStats } from "@/types/player";

interface ProfileHeaderProps {
  player: Player;
  platform: string;
  // 스쿼드 랭크가 있으면 티어·RP 표시 (없으면 생략)
  rankedStat?: RankedGameModeStats;
  /** 이번 렌더가 실패한 값으로 채워졌는가 — 업데이트 버튼이 대기를 걸지 판단한다. */
  loadFailed?: boolean;
}

export default function ProfileHeader({
  player,
  platform,
  rankedStat,
  loadFailed = false,
}: ProfileHeaderProps) {
  const name = player.attributes.name;
  const validPlatform = isPlatform(platform) ? platform : null;
  const PlatformIcon = validPlatform ? PLATFORM_ICON[validPlatform] : null;
  const platformLabel = validPlatform ? PLATFORM_LABEL[validPlatform] : platform;
  const tier = rankedStat?.currentTier;
  const rp = rankedStat?.currentRankPoint;

  return (
    <div className="flex items-center gap-5 rounded-lg border border-hairline bg-surface p-6 shadow-xs">
      <Avatar alt={name} size="lg" />
      <div className="flex flex-1 flex-col gap-2">
        <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
        <div className="flex flex-wrap items-center gap-2 text-caption text-text-secondary">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-muted py-1 px-2.5">
            {PlatformIcon && <PlatformIcon className="h-3.5 w-3.5" />}
            {platformLabel}
          </span>
          {tier && <TierBadge tier={tier.tier} subTier={tier.subTier} rankPoint={rp} size="sm" />}
        </div>
      </div>
      <UpdateButton platform={platform} name={name} loadFailed={loadFailed} />
    </div>
  );
}
