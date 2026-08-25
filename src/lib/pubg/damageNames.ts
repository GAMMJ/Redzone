// 텔레메트리 코드 → 화면에 쓸 이름.
//
// 177매치를 전수 조사해 실제로 나오는 코드를 다 세어 보고 짰다.
// 조사 결과는 docs/local/scratch/damage-code-audit.md 에 있다.
//
// 공식 사전(damageCauserName.ts)은 2024-10 이후 갱신이 멈췄다. 우리 사본은 공식과
// 209개로 완전히 일치하므로 빠진 것은 우리 잘못이 아니라 원본이 낡아서다.
// 사본은 공식 데이터라 손대지 않고, 부족한 부분만 여기서 덮는다.
import { DAMAGE_CAUSER_NAME } from "@/lib/pubg/damageCauserName";

/**
 * 코드를 직접 지정한다.
 *
 * 두 가지 경우에 쓴다 — 공식 사전에 아예 없는 코드, 그리고 여러 코드를 하나로 뭉칠 때.
 */
const CODE_NAME: Record<string, string> = {
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

  // 공식 사전이 멈춘 뒤에 나온 총기. 코드에서 접두사만 걷어내도 읽히지만
  // FAMAS는 그러면 "FamasG2"가 되어 게임 안 표기와 어긋난다.
  WeapRPD_C: "RPD",
  WeapFamasG2_C: "FAMAS",

  // 곡괭이도 사전에 없다. 던진 것은 카테고리가 "(투척)"을 붙여 준다.
  WeapPickaxe_C: "곡괭이",
  WeapPickaxeProjectile_C: "곡괭이",

  // 사전에 없는 탈것. e스포츠 스킨과 이벤트 스킨은 본체와 같은 이름으로 묶는다.
  BP_Blanc_Esports_C: "쿠페 SUV",
  BP_Bicycle_Succubus_C: "자전거",
  BP_PicoBus_C: "피코 버스",
  BP_Vantage_LGD_C: "밴티지",
  BP_Mirado_A_01_C: "미라도",
  BP_Mirado_A_04_C: "미라도",
  BP_VK_Train_A_B_C: "기차",

  // 주유기는 맵마다 코드가 다르고 셋 다 사전에 없다.
  BP_Baltic_GasPump_C: "주유기",
  BP_Tiger_GasStationB_Gaspump_C: "주유기",
  BP_NE_GasPump_C: "주유기",

  RedZoneBombingField_Savage_C: "레드존",

  // 신호탄이 부른 것들. 신호탄 자체가 아니라 떨어지는 물체에 깔린다.
  BP_StructDrop_C: "긴급 엄폐물",
  BP_CarePackageDrop_Bluechip_CR_C: "보급 상자",
};

/**
 * 공식 사전이 준 **영어 이름**을 우리말로.
 *
 * 코드가 아니라 이름을 다루는 이유는 수가 훨씬 적어서다. 차량 코드는 62종이 나오지만
 * 모델은 스무 개 남짓이다(`Dacia_A_01_v2_C`·`Dacia_A_02_v2_C`… 가 모두 `Dacia`).
 *
 * 총기는 넣지 않는다. 한국 유저도 ACE32·Kar98k·Beryl로 부른다.
 * 무기가 아닌 것(탈것·환경·상황)만 우리말로 바꾼다.
 */
const KO_NAME: Record<string, string> = {
  // 탈것 — 변형 이름에 괄호를 쓰지 않는다. 뒤에 "(치임)"이 붙으면 괄호가 겹친다
  Airboat: "에어보트",
  Aquarail: "아쿠아레일",
  Buggy: "버기",
  "Coupe RB": "쿠페 RB",
  "Coupe SUV": "쿠페 SUV",
  Dacia: "다시아",
  "Dirt Bike": "더트바이크",
  "Ferry Damage": "페리",
  "Food Truck": "푸드트럭",
  "Kill Truck": "킬 트럭",
  "Loot Truck": "보급 트럭",
  Mirado: "미라도",
  "Mirado (open top)": "미라도 오픈탑",
  "Motor Glider": "모터 글라이더",
  Motorcycle: "오토바이",
  "Motorcycle (w/ Sidecar)": "사이드카 오토바이",
  "Mountain Bike": "자전거",
  "Pickup Truck (closed top)": "픽업트럭",
  "Pickup Truck (open top)": "픽업트럭 오픈탑",
  "Pillar Scout Helicopter": "정찰 헬기",
  "Pillar Security Car": "경비 차량",
  "Pony Coupe": "포니 쿠페",
  Porter: "포터",
  Quad: "쿼드바이크",
  Rony: "로니",
  Scooter: "스쿠터",
  Snowbike: "스노바이크",
  Snowmobile: "스노모빌",
  Train: "기차",
  Tukshai: "툭샤이",
  "UAZ (armored)": "UAZ 장갑",
  "UAZ (hard top)": "UAZ 하드탑",
  "UAZ (open top)": "UAZ 오픈탑",
  "UAZ (soft top)": "UAZ 소프트탑",
  Van: "밴",
  Zima: "지마",

  // 근접 — 던진 것과 휘두른 것은 카테고리가 갈라 주므로 이름은 같게 둔다
  Pan: "프라이팬",
  "Pan Projectile": "프라이팬",
  Machete: "마체테",
  "Machete Projectile": "마체테",
  Sickle: "낫",
  "Sickle Projectile": "낫",
  Crowbar: "쇠지렛대",
  "Crowbar Projectile": "쇠지렛대",

  Panzerfaust: "판처파우스트",
  "Panzerfaust Projectile": "판처파우스트",

  // 환경·기타
  Bear: "곰",
  Blackzone: "블랙존",
  Bluezone: "자기장",
  "Bluezone Grenade": "블루존 수류탄",
  Burn: "화상",
  "Care Package": "보급 상자",
  "Destructible Surface": "부서진 지형",
  Drone: "드론",
  Drowning: "익사",
  "Emergency Aircraft": "긴급 항공기",
  "Frag Grenade": "수류탄",
  "Gas Pump": "주유기",
  "Incendiary Projectile": "소이탄",
  Jerrycan: "기름통",
  "Jerrycan Fire": "기름통 불길",
  Lava: "용암",
  "Mortar Projectile": "박격포",
  None: "알 수 없음",
  "Object Fragments": "파편",
  "Propane Tank": "프로판 탱크",
  Redzone: "레드존",
  Sandstorm: "모래폭풍",
  "Spike Trap": "스파이크 트랩",
  "Sticky Bomb": "점착 폭탄",
};

/**
 * 가해자를 볼 것도 없이 원인이 정해지는 피해 종류.
 *
 * 자기장에 죽으면 가해자 코드가 `TslGameModeBase_BattleRoyaleBP_C`이고, 맨주먹에 죽으면
 * 상대 캐릭터 코드(`PlayerFemale_A_C`)다. 둘 다 그대로 보여줄 수 없다.
 *
 * 무기 이름이 뜻을 더해 주는 종류는 여기 넣지 않는다. `Damage_Gun`을 "총격"으로 덮으면
 * 어떤 총인지 잃고, `Damage_Monster`를 "야생 동물"로 덮으면 "곰"보다 흐려진다.
 */
const DEATH_CAUSE: Record<string, string> = {
  Damage_BlueZone: "자기장",
  Damage_BlueZoneGrenade: "블루존 수류탄",
  Damage_Explosion_BlackZone: "블랙존",
  Damage_Explosion_RedZone: "레드존",
  Damage_Instant_Fall: "낙사",
  Damage_Drown: "익사",
  Damage_Groggy: "출혈",
  Damage_DBNO: "출혈",
  Damage_Molotov: "화염병",
  Damage_Blizzard: "눈보라",
  Damage_SandStorm: "모래폭풍",
  Damage_Lava: "용암",

  // 맨주먹 — 가해자가 상대 캐릭터 코드라 그냥 두면 "Player"가 찍힌다
  Damage_Punch: "맨주먹",

  // 탑승 중 사고. 가해자는 탄 차라서 이름을 붙여도 "무엇에 당했나"가 흐려진다
  Damage_VehicleCrashHit: "차량 충돌",

  // 폭발한 물건이 곧 원인인 것들. 가해자가 비어 있거나(`None`) 내부 코드다
  Damage_Explosion_Vehicle: "차량 폭발",
  Damage_Explosion_GasPump: "주유기 폭발",
  Damage_Explosion_LootTruck: "보급 트럭 폭발",
  Damage_Explosion_PropaneTank: "프로판 탱크",
  Damage_Explosion_Aircraft: "비행기 폭발",
  Damage_Explosion_Breach: "브리칭 폭발",

  // 신호탄이 부른 낙하물. 조사에서는 죽이지 않고 기절만 시켰다
  Damage_DropStructHit: "긴급 엄폐물",
  Damage_CarePackageDropHit: "보급 상자",

  Damage_HelicopterHit: "정찰 헬기",
  Damage_KillTruckHit: "킬 트럭",
  Damage_KillTruckTurret: "킬 트럭 기관총",
  Damage_DronePackage: "드론",
  Damage_MotorGlider: "모터 글라이더",
  SpikeTrap: "스파이크 트랩",
  Damage_None: "알 수 없음",
};

/**
 * 이름 뒤에 붙여 상황을 밝힌다.
 *
 * 이름만으로는 같은 값이 서로 다른 상황을 덮는 경우가 있다. 차에 치인 것과 차량 충돌이
 * 둘 다 차량 이름만 나오고, 낫을 던진 것과 휘두른 것이 구분되지 않는다.
 * 카테고리로 덮어 버리면 무엇에 당했는지를 잃으므로, 이름은 두고 뒤에 덧붙인다.
 */
const CATEGORY_SUFFIX: Record<string, string> = {
  Damage_VehicleHit: "치임",
  Damage_TrainHit: "치임",
  Damage_ShipHit: "치임",
  Damage_LootTruckHit: "치임",
  Damage_Rotor: "프로펠러",
  Damage_MeleeThrow: "투척",
  Damage_Gun_Penetrate_BRDM: "관통",
  Damage_Explosion_PanzerFaustBackBlast: "후폭풍",

  // 근접 무기로 뒤에서 쳐서 한 방에 죽이는 경우. 조사에서 가해자는 전부
  // 프라이팬(7건)과 쇠지렛대(1건)였고 damageReason도 CKO로 온다.
  Damage_CKO: "기습",
};

// 공식 사전이 멈춘 뒤에 나온 코드는 접두·접미를 걷어내면 대체로 읽을 만하다. WeapMP9_C → MP9
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
  const direct = CODE_NAME[code];
  if (direct) return direct;
  const official = DAMAGE_CAUSER_NAME[code];
  if (official) return KO_NAME[official] ?? official;
  return humanizeCode(code);
}

/** 무기든 환경이든 "무엇에 당했나"를 한 문자열로. */
export function causeName(category: string, causer: string): string {
  const fixed = DEATH_CAUSE[category];
  if (fixed) return fixed;

  const name = weaponName(causer);
  const suffix = CATEGORY_SUFFIX[category];
  return suffix && name ? `${name}(${suffix})` : name;
}
