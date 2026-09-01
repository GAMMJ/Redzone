import Link from "next/link";
import LoadFailure from "@/components/ui/LoadFailure";
import type { Loaded } from "@/lib/pubg/records";
import { GAME_MODES, type GameMode } from "@/lib/constants";
import type { LifetimeStats, SurvivalMastery, WeaponMastery } from "@/types/stats";
import { formatCount, formatDistance, formatDuration } from "@/components/stats/statsFormat";
import { LIFETIME_GROUPS, WEAPON_COLUMNS, type Unit } from "@/components/stats/lifetimeFields";

// 개인 통계 화면.
//
// 통산 값은 성격별로 묶어 보여 준다. 26개를 한 격자에 평평하게 깔면 `판수`와 `수영 거리`가
// 같은 무게로 보여, 무엇을 먼저 봐야 하는지가 화면에 없다.
//
// 단위는 라벨이 아니라 값이 갖는다(`statsFormat.ts`). PUBG가 초·미터를 소수점째로 주기
// 때문에, 라벨에 `(초)`를 달고 값을 그대로 찍으면 `최장 생존 1,975.112`가 된다.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-secondary">{title}</h2>
      {children}
    </section>
  );
}

interface Row {
  label: string;
  value: string;
  /** 0인 값. 자리는 지키되 눈에 덜 걸리게 둔다 — 0도 정보라 지우지는 않는다. */
  muted?: boolean;
}

function Rows({ rows }: { rows: Row[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg border border-hairline bg-surface p-4 lg:grid-cols-4">
      {rows.map(({ label, value, muted }) => (
        <div key={label} className="flex items-baseline justify-between gap-2">
          <span className="text-caption text-text-tertiary">{label}</span>
          <span
            className={`font-mono text-sm ${muted ? "text-text-tertiary" : "font-bold text-text-primary"}`}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

const MODE_LABEL: Record<GameMode, string> = {
  solo: "솔로",
  "solo-fpp": "솔로 FPP",
  duo: "듀오",
  "duo-fpp": "듀오 FPP",
  squad: "스쿼드",
  "squad-fpp": "스쿼드 FPP",
};

/** 기본 모드. 가장 많이 뛰는 판이라 여기서 시작한다. */
export const DEFAULT_MODE: GameMode = "squad";

/** 주소에서 읽은 모드 값을 쓸 수 있는 것으로 정리한다. 모르는 값은 기본 모드. */
export function parseMode(raw: string | undefined): GameMode {
  return (GAME_MODES as readonly string[]).includes(raw ?? "") ? (raw as GameMode) : DEFAULT_MODE;
}

function formatStat(value: number, unit: Unit = "count"): string {
  if (unit === "duration") return formatDuration(value);
  if (unit === "distance") return formatDistance(value);
  return formatCount(value);
}

interface PersonalStatsProps {
  lifetime: Loaded<Partial<Record<GameMode, LifetimeStats>>>;
  weapons: Loaded<WeaponMastery[]>;
  survival: Loaded<SurvivalMastery | null>;
  /** 보고 있는 모드. 주소(`?mode=`)에서 온다. */
  mode: GameMode;
  /** 모드를 바꾸는 링크. 검색한 사람과 탭은 그대로 둔다. */
  hrefForMode: (mode: GameMode) => string;
}

export default function PersonalStats({
  lifetime,
  weapons,
  survival,
  mode,
  hrefForMode,
}: PersonalStatsProps) {
  // 원본은 여섯 모드를 다 준다(솔로·듀오·스쿼드 × TPP/FPP). 뛰지 않은 모드는 키가 없다.
  const modes = GAME_MODES.filter((m) => lifetime.data[m] !== undefined);
  const stats = lifetime.data[mode];

  return (
    <div className="flex flex-col gap-8">
      <Section title="통산 스탯">
        {lifetime.failed ? (
          <div className="rounded-lg border border-hairline bg-surface">
            <LoadFailure message="통산 스탯을 불러오지 못했습니다." />
          </div>
        ) : modes.length === 0 ? (
          <p className="rounded-lg border border-hairline bg-surface p-6 text-center text-caption text-text-tertiary">
            통산 기록이 없습니다
          </p>
        ) : (
          <>
            {/* 모드는 주소(`?mode=`)에 담는다 — 탭과 같은 이유다. 뛰지 않은 모드는 안 보인다. */}
            <div className="flex flex-wrap items-center gap-1">
              {modes.map((m) => (
                <Link
                  key={m}
                  href={hrefForMode(m)}
                  aria-current={m === mode ? "page" : undefined}
                  className={`rounded-sm px-3 py-1.5 text-caption font-semibold transition-colors ${
                    m === mode
                      ? "bg-primary-soft text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {MODE_LABEL[m]}
                </Link>
              ))}
            </div>
            {stats ? (
              <div className="flex flex-col gap-4">
                {LIFETIME_GROUPS.map((group) => (
                  <div key={group.title} className="flex flex-col gap-2">
                    <h3 className="text-caption font-semibold text-text-tertiary">{group.title}</h3>
                    <Rows
                      rows={group.fields.map((field) => ({
                        label: field.label,
                        value: formatStat(stats[field.key], field.unit),
                        muted: stats[field.key] === 0,
                      }))}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-hairline bg-surface p-6 text-center text-caption text-text-tertiary">
                이 모드는 기록이 없습니다
              </p>
            )}
          </>
        )}
      </Section>

      <Section title="생존 마스터리">
        {survival.failed ? (
          <div className="rounded-lg border border-hairline bg-surface">
            <LoadFailure message="생존 마스터리를 불러오지 못했습니다." />
          </div>
        ) : !survival.data ? (
          <p className="rounded-lg border border-hairline bg-surface p-6 text-center text-caption text-text-tertiary">
            생존 기록이 없습니다
          </p>
        ) : (
          <>
            {/* 원본은 지표 17종도 주지만 담지 않는다 — 61개 값 중 하나만 채워져 있고
                나머지는 전부 0이다(판수 2,454인 계정과 26,013인 계정이 똑같았다).
                여기 넷만이 실제로 채워지는 값이다. */}
            <Rows
              rows={[
                { label: "레벨", value: formatCount(survival.data.level) },
                { label: "레벨 티어", value: formatCount(survival.data.tier) },
                { label: "XP", value: formatCount(survival.data.xp) },
                { label: "누적 판수", value: formatCount(survival.data.totalMatchesPlayed) },
              ]}
            />
          </>
        )}
      </Section>

      <Section title="무기 숙련도 (XP 상위)">
        {weapons.failed ? (
          <div className="rounded-lg border border-hairline bg-surface">
            <LoadFailure message="무기 숙련도를 불러오지 못했습니다." />
          </div>
        ) : weapons.data.length === 0 ? (
          <p className="rounded-lg border border-hairline bg-surface p-6 text-center text-caption text-text-tertiary">
            무기 기록이 없습니다
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
            <table className="w-full min-w-[680px] text-caption">
              <thead className="border-b border-hairline text-text-tertiary">
                {/* 열 이름은 스켈레톤과 나눠 쓴다 — 개수가 어긋나면 결과가 도착할 때 표가 튄다 */}
                <tr>
                  {WEAPON_COLUMNS.map((label, index) => (
                    <th
                      key={label}
                      className={`px-4 py-2 font-medium ${index === 0 ? "text-left" : "text-right"}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weapons.data.map((w) => (
                  <tr key={w.code} className="border-b border-hairline last:border-0">
                    <td className="px-4 py-2 font-medium text-text-primary">{w.name}</td>
                    <td className="px-4 py-2 text-right font-mono">{w.level}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatCount(w.xp)}</td>
                    <td className="px-4 py-2 text-right font-mono">{w.official.kills}</td>
                    <td className="px-4 py-2 text-right font-mono">{w.competitive.kills}</td>
                    <td className="px-4 py-2 text-right font-mono">{w.official.headShots}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {formatCount(w.official.damage)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{w.official.longest}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
