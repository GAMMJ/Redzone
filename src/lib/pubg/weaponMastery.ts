import { WEAPON_ALIAS } from "@/lib/pubg/weaponAlias";
import type { WeaponMastery, WeaponScore } from "@/types/stats";

// 무기 숙련도 원본을 화면이 쓸 모양으로 줄인다.
//
// 원본은 무기 59종을 주고 종마다 성적이 세 갈래다. 통째로 캐시하면 사람 하나당 그만큼을
// 들고 있게 되는데, 화면에 다 쓰지도 않는다. summarizeTelemetry가 "97명 전원의 모든 무기를
// 담으면 요약이 불필요하게 커진다"며 상위만 남긴 것과 같은 판단이다.
//
// 몇 종을 남길지·무엇을 담을지가 여기 한 곳에 모여 있다. 나중에 전체 표가 필요해지면
// 이 파일과 캐시 버전만 고치면 된다.

/**
 * 남길 무기 수. XP 순으로 자른다.
 *
 * 실측하면 59종 중 57종에 값이 있지만, 대부분은 몇 판 써 본 정도다. 상위 12종이면
 * "이 사람이 무엇을 쓰는가"는 충분히 드러난다.
 */
export const TOP_WEAPONS = 12;

/**
 * 요약 모양 버전. 캐시 키에 넣는다.
 *
 * 아래 담는 필드를 바꾸면 옛 요약이 TTL 내내 그대로 나가므로 그때마다 올릴 것.
 */
export const WEAPON_MASTERY_SCHEMA_VERSION = "v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * 갈래마다 키가 달라 한 모양으로 맞춘다.
 *
 * 전체(`StatsTotal`)는 눕힌 것을 `Defeats`, 최장 거리를 `LongestDefeat`로 부르고,
 * 일반전·경쟁전은 `Kills`·`LongestKill`을 쓴다. 같은 뜻인데 이름이 달라서, 그대로 두면
 * 화면이 갈래마다 다른 필드를 알아야 한다.
 */
function toScore(raw: unknown): WeaponScore {
  const r = isRecord(raw) ? raw : {};
  return {
    kills: num(r.Kills),
    headShots: num(r.HeadShots),
    groggies: num(r.Groggies),
    damage: Math.round(num(r.DamagePlayer)),
    // LongestKill이 없으면 LongestDefeat가 그 자리다
    longest: Math.round(num(r.LongestKill) || num(r.LongestDefeat)),
    mostKillsInAGame: num(r.MostKillsInAGame),
  };
}

/**
 * 무기 코드를 화면에 쓸 이름으로.
 *
 * 별칭표(`weaponAlias.ts`)가 먼저다. 접두사만 벗기면 `BerylM762`처럼 실제로 부르지 않는
 * 이름이 남기 때문이다. 표에 없으면 접두사·접미사만 벗겨서 쓴다 — 새 무기가 추가돼도
 * 코드가 그대로 노출될 뿐 깨지지 않는다.
 */
export function masteryWeaponName(code: string): string {
  return WEAPON_ALIAS[code] ?? code.replace(/^Item_Weapon_/, "").replace(/_C$/, "");
}

/** 원본 `weaponSummaries` → XP 상위 몇 종. 값이 없는 무기는 뺀다. */
export function summarizeWeaponMastery(raw: unknown): WeaponMastery[] {
  if (!isRecord(raw)) return [];

  const list: WeaponMastery[] = [];
  for (const [code, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue;
    const xp = num(value.XPTotal);
    // 한 번도 안 쓴 무기는 XP가 0이다. 담아 봐야 빈 줄만 늘어난다.
    if (xp <= 0) continue;
    list.push({
      code,
      name: masteryWeaponName(code),
      xp,
      level: num(value.LevelCurrent),
      tier: num(value.TierCurrent),
      total: toScore(value.StatsTotal),
      official: toScore(value.OfficialStatsTotal),
      competitive: toScore(value.CompetitiveStatsTotal),
    });
  }

  return list.sort((a, b) => b.xp - a.xp).slice(0, TOP_WEAPONS);
}
