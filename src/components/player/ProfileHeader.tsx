import { Shield } from "lucide-react";
import { PLATFORM_LABEL, PLATFORM_ICON, isPlatform } from "@/lib/constants";
import type { Player, RankedGameModeStats } from "@/types/player";
import { formatTier } from "@/lib/tier";

interface ProfileHeaderProps {
  player: Player;
  platform: string;
  // 스쿼드 랭크가 있으면 티어·RP 표시 (없으면 생략)
  rankedStat?: RankedGameModeStats;
}

export default function ProfileHeader({ player, platform, rankedStat }: ProfileHeaderProps) {
  const name = player.attributes.name;
  const validPlatform = isPlatform(platform) ? platform : null;
  const PlatformIcon = validPlatform ? PLATFORM_ICON[validPlatform] : null;
  const platformLabel = validPlatform ? PLATFORM_LABEL[validPlatform] : platform;
  const tier = rankedStat?.currentTier;
  const rp = rankedStat?.currentRankPoint;

  return (
    <div className="flex items-center gap-5 rounded-lg border border-hairline bg-surface p-6 shadow-xs">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-pill bg-surface-muted text-2xl font-bold text-text-secondary">
        {name.charAt(0).toUpperCase()}
      </span>
      <div className="flex flex-1 flex-col gap-2">
        <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
        <div className="flex flex-wrap items-center gap-2 text-caption text-text-secondary">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-muted py-1 px-2.5">
            {PlatformIcon && <PlatformIcon className="h-3.5 w-3.5" />}
            {platformLabel}
          </span>
          {tier && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-text-primary">
              <Shield className="h-4 w-4 shrink-0 text-text-tertiary" />
              {formatTier(tier.tier, tier.subTier)}
              {typeof rp === "number" && (
                <span className="font-mono text-primary">· {rp.toLocaleString()} RP</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
