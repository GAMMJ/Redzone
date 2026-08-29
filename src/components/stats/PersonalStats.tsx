import Link from "next/link";
import LoadFailure from "@/components/ui/LoadFailure";
import type { Loaded } from "@/lib/pubg/records";
import { GAME_MODES, type GameMode } from "@/lib/constants";
import type { LifetimeStats, SurvivalMastery, WeaponMastery } from "@/types/stats";

// 1단계 화면 — 꾸미지 않고 값만 그대로 보여 준다.
//
// 목적은 "데이터가 화면까지 닿는가"와 "어떤 필드가 비어 오는가"를 드러내는 것이다.
// 디자인은 2단계에서 한다. 여기서 예쁘게 만들면 빈 값이 가려진다.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-secondary">{title}</h2>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, string | number][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg border border-hairline bg-surface p-4 lg:grid-cols-4">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-2">
          <span className="text-caption text-text-tertiary">{label}</span>
          {/* 0으로만 오는 필드를 눈에 띄게 둔다 — 2단계에서 무엇을 버릴지의 근거다 */}
          <span
            className={`font-mono text-sm ${value === 0 ? "text-text-tertiary" : "font-bold text-text-primary"}`}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
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

const LIFETIME_LABEL: [keyof LifetimeStats, string][] = [
  ["roundsPlayed", "판수"],
  ["wins", "승리"],
  ["losses", "패배"],
  ["top10s", "Top 10"],
  ["days", "플레이한 날"],
  ["kills", "킬"],
  ["assists", "어시스트"],
  ["dBNOs", "기절시킴"],
  ["headshotKills", "헤드샷 킬"],
  ["damageDealt", "누적 딜량"],
  ["longestKill", "최장 킬(m)"],
  ["roundMostKills", "한 판 최다 킬"],
  ["maxKillStreaks", "최다 연속 킬"],
  ["teamKills", "팀킬"],
  ["roadKills", "차량 킬"],
  ["suicides", "자살"],
  ["timeSurvived", "누적 생존(초)"],
  ["longestTimeSurvived", "최장 생존(초)"],
  ["revives", "부활시킴"],
  ["walkDistance", "도보(m)"],
  ["rideDistance", "탑승(m)"],
  ["swimDistance", "수영(m)"],
  ["vehicleDestroys", "차량 파괴"],
  ["heals", "회복 사용"],
  ["boosts", "부스트 사용"],
  ["weaponsAcquired", "주운 무기"],
];

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
              <Rows rows={LIFETIME_LABEL.map(([key, label]) => [label, stats[key]])} />
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
                ["레벨", survival.data.level],
                ["레벨 티어", survival.data.tier],
                ["XP", survival.data.xp],
                ["누적 판수", survival.data.totalMatchesPlayed],
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
            <table className="w-full min-w-[760px] text-caption">
              <thead className="border-b border-hairline text-text-tertiary">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">무기</th>
                  <th className="px-4 py-2 text-right font-medium">Lv</th>
                  <th className="px-4 py-2 text-right font-medium">XP</th>
                  <th className="px-4 py-2 text-right font-medium">킬(전체)</th>
                  <th className="px-4 py-2 text-right font-medium">킬(일반)</th>
                  <th className="px-4 py-2 text-right font-medium">킬(경쟁)</th>
                  <th className="px-4 py-2 text-right font-medium">헤드샷(일반)</th>
                  <th className="px-4 py-2 text-right font-medium">딜량(일반)</th>
                  <th className="px-4 py-2 text-right font-medium">최장(일반)</th>
                </tr>
              </thead>
              <tbody>
                {weapons.data.map((w) => (
                  <tr key={w.code} className="border-b border-hairline last:border-0">
                    <td className="px-4 py-2 font-medium text-text-primary">{w.name}</td>
                    <td className="px-4 py-2 text-right font-mono">{w.level}</td>
                    <td className="px-4 py-2 text-right font-mono">{w.xp.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-mono">{w.total.kills}</td>
                    <td className="px-4 py-2 text-right font-mono">{w.official.kills}</td>
                    <td className="px-4 py-2 text-right font-mono">{w.competitive.kills}</td>
                    <td className="px-4 py-2 text-right font-mono">{w.official.headShots}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {w.official.damage.toLocaleString()}
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
