// 매치 텔레메트리(이벤트 5만 개, 30MB 이상) → 화면이 쓸 요약.
// 이벤트 종류와 필드는 docs/local/TELEMETRY.md에 정리돼 있다.
import { DAMAGE_CAUSER_NAME } from "@/lib/pubg/damageCauserName";
import type {
  MatchTelemetry,
  TelemetryGroggy,
  TelemetryKill,
  TelemetryPoint,
  TelemetryRevive,
  TelemetryWeaponUse,
} from "@/types/telemetry";

/** 플레이어당 남길 무기 수. 첫 항목이 주무기다. */
const WEAPONS_PER_PLAYER = 3;

// 가해자 없이 죽는 경우(자기장·낙사 등). 이때 killerDamageInfo는 비어 있고
// 실제 원인은 finishDamageInfo에 있는데, 거기 코드가 TslGameModeBase_BattleRoyaleBP_C 같은
// 내부 이름이라 그대로 보여줄 수 없다. 피해 종류로 바꿔 읽을 수 있게 한다.
const DEATH_CAUSE: Record<string, string> = {
  Damage_BlueZone: "자기장",
  Damage_BlueZoneGrenade: "블루존 수류탄",
  Damage_Instant_Fall: "낙사",
  Damage_Drown: "익사",
  Damage_Explosion_RedZone: "레드존",
  Damage_Groggy: "출혈",
  Damage_DBNO: "출혈",
  Damage_Molotov: "화염병",
  Damage_Blizzard: "눈보라",
};

// 공식 사전 위에 덮어쓰는 이름.
//
// 총기는 한국 유저도 영문으로 부르므로(ACE32·Kar98k·Beryl) 사전 값을 그대로 쓴다.
// 사전이 코드명보다 정확한 경우도 많다 — WeapAK47_C는 실제 게임에서 AKM이고 사전이 그렇게 준다.
//
// 반면 투척류는 한국어로 부른다. 사망 원인을 "자기장"·"낙사"로 적는 것과 결이 같다.
// 사전 파일(damageCauserName.ts)은 공식 데이터 사본이라 손대지 않고 여기서만 갈아끼운다.
const NAME_OVERRIDE: Record<string, string> = {
  ProjGrenade_C: "수류탄",
  ProjStickyGrenade_C: "점착 폭탄",

  // 화염병 한 발은 코드 셋을 남긴다 — 병 직격, 바닥 불길, 옮겨 붙은 화상.
  // 실측하면 직격은 드물고(1건) 대부분 불길과 화상으로 깎인다.
  // 사용자에게는 "화염병에 죽었다"가 전부라 셋을 하나로 뭉친다. 소이탄도 같은 이유로 묶는다.
  ProjMolotov_C: "화염병",
  ProjMolotov_DamageField_Direct_C: "화염병",
  BP_FireEffectController_C: "화염병",
  BP_MolotovFireDebuff_C: "화염병",
  ProjIncendiary_C: "소이탄",
  BP_IncendiaryDebuff_C: "소이탄",
};

// 공식 사전은 2024-10 이후 갱신되지 않아 최신 무기가 빠져 있다(RPD 등).
// 코드에서 접두·접미를 걷어내면 대체로 읽을 만한 이름이 된다. WeapRPD_C → RPD
function humanizeCode(code: string): string {
  return (
    code
      .replace(/^Weap/, "")
      .replace(/^Proj/, "")
      .replace(/^BP_/, "")
      .replace(/_C(_\d+)?$/, "")
      .replace(/_/g, " ")
      .trim() || code
  );
}

export function weaponName(code: string | undefined | null): string {
  if (!code) return "";
  return NAME_OVERRIDE[code] ?? DAMAGE_CAUSER_NAME[code] ?? humanizeCode(code);
}

// 무기든 환경이든 "무엇에 죽었나"를 한 문자열로. 피해 종류가 자기장·낙사면 그쪽을 우선한다.
function causeName(info: Record<string, unknown>): string {
  const category = toStr(info.damageTypeCategory);
  const byCategory = DEATH_CAUSE[category];
  if (byCategory) return byCategory;
  return weaponName(toStr(info.damageCauserName));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function toStr(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// character/attacker 같은 인물 객체에서 이름만 꺼낸다. 자기장 사망 등은 가해자가 없다.
function nameOf(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const name = toStr(value.name);
  return name === "" ? null : name;
}

// 텔레메트리 좌표는 1 = 1cm다. 미터로 줄인다.
// 지도가 8km를 819px로 그리므로 1m 단위면 충분하고(1m ≈ 0.1px), 자릿수가 둘 줄어든다.
function pointOf(value: unknown): TelemetryPoint | null {
  if (!isRecord(value)) return null;
  const loc = value.location;
  if (!isRecord(loc)) return null;
  return { x: Math.round(toNumber(loc.x) / 100), y: Math.round(toNumber(loc.y) / 100) };
}

function secondsFrom(startMs: number, iso: unknown): number {
  const t = Date.parse(toStr(iso));
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.round((t - startMs) / 1000));
}

// 딜량 상위 몇 개만 남긴다. 97명 전원의 모든 무기를 담으면 요약이 불필요하게 커진다.
function topWeapons(byWeapon: Map<string, number>): TelemetryWeaponUse[] {
  return [...byWeapon.entries()]
    .map(([weapon, damage]) => ({ weapon, damage: Math.round(damage) }))
    .sort((a, b) => b.damage - a.damage)
    .slice(0, WEAPONS_PER_PLAYER);
}

/**
 * 텔레메트리 이벤트 배열을 요약으로 줄인다.
 *
 * 한 번 훑으면서 필요한 이벤트만 골라낸다. 5만 개를 여러 번 돌 이유가 없다.
 * 형태가 어긋난 이벤트는 조용히 건너뛴다 — 한 건 때문에 매치 전체가 사라지는 것보다 낫다.
 */
export function summarizeTelemetry(raw: unknown): MatchTelemetry | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  // 매치 시작 시각. 이후 모든 시각을 여기서부터의 경과 초로 바꾼다.
  const first = raw.find((e) => isRecord(e) && toStr(e._D) !== "");
  const startedAt = isRecord(first) ? toStr(first._D) : "";
  const startMs = Date.parse(startedAt);
  if (!Number.isFinite(startMs)) return null;

  const kills: TelemetryKill[] = [];
  const groggy: TelemetryGroggy[] = [];
  const revives: TelemetryRevive[] = [];
  const weapons = new Map<string, Map<string, number>>();
  const damageTaken = new Map<string, number>();

  for (const event of raw) {
    if (!isRecord(event)) continue;

    switch (event._T) {
      case "LogPlayerKillV2": {
        const victim = nameOf(event.victim);
        if (!victim) break;

        // 가해자가 있으면 killerDamageInfo, 없으면(자기장·낙사) finishDamageInfo에 원인이 있다.
        const killerInfo = isRecord(event.killerDamageInfo) ? event.killerDamageInfo : {};
        const finishInfo = isRecord(event.finishDamageInfo) ? event.finishDamageInfo : {};
        const causer = toStr(killerInfo.damageCauserName);
        const info = causer === "" ? finishInfo : killerInfo;

        kills.push({
          at: secondsFrom(startMs, event._D),
          killer: nameOf(event.killer),
          victim,
          weapon: causeName(info),
          // distance는 가해자가 없으면 -1로 온다
          distanceM: Math.max(0, Math.round(toNumber(info.distance) / 100)),
          bodyPart: toStr(info.damageReason),
          isSuicide: event.isSuicide === true,
          killerAt: pointOf(event.killer),
          victimAt: pointOf(event.victim) ?? { x: 0, y: 0 },
        });
        break;
      }

      case "LogPlayerMakeGroggy": {
        const victim = nameOf(event.victim);
        if (!victim) break;
        groggy.push({
          at: secondsFrom(startMs, event._D),
          attacker: nameOf(event.attacker),
          victim,
          weapon: weaponName(toStr(event.damageCauserName)),
          distanceM: Math.round(toNumber(event.distance) / 100),
          bodyPart: toStr(event.damageReason),
        });
        break;
      }

      case "LogPlayerRevive": {
        const reviver = nameOf(event.reviver);
        const victim = nameOf(event.victim);
        if (!reviver || !victim) break;
        revives.push({ at: secondsFrom(startMs, event._D), reviver, victim });
        break;
      }

      case "LogPlayerTakeDamage": {
        const damage = toNumber(event.damage);
        if (damage <= 0) break;

        // 받은 피해 — 매치 API에는 없는 지표다.
        const victim = nameOf(event.victim);
        if (victim) damageTaken.set(victim, (damageTaken.get(victim) ?? 0) + damage);

        // 주무기는 여기서 나온다. LogMatchEnd.allWeaponStats는 우승 팀만 담고 있어 쓸 수 없다.
        // 자해(낙사·자기장)는 무기로 볼 수 없어 제외한다.
        const attacker = nameOf(event.attacker);
        if (!attacker || attacker === victim) break;
        const code = toStr(event.damageCauserName);
        if (code === "") break;
        const name = weaponName(code);
        const byWeapon = weapons.get(attacker) ?? new Map<string, number>();
        byWeapon.set(name, (byWeapon.get(name) ?? 0) + damage);
        weapons.set(attacker, byWeapon);
        break;
      }

      default:
        break;
    }
  }

  const weaponsByPlayer: Record<string, TelemetryWeaponUse[]> = {};
  for (const [player, byWeapon] of weapons) weaponsByPlayer[player] = topWeapons(byWeapon);

  const damageTakenByPlayer: Record<string, number> = {};
  for (const [player, total] of damageTaken) damageTakenByPlayer[player] = Math.round(total);

  return { startedAt, kills, groggy, revives, weaponsByPlayer, damageTakenByPlayer };
}

/** 그 플레이어가 가장 많은 피해를 낸 무기. 한 발도 쏘지 않았으면 null. */
export function mainWeaponOf(telemetry: MatchTelemetry, playerName: string): string | null {
  return telemetry.weaponsByPlayer[playerName]?.[0]?.weapon ?? null;
}
