// 통산 스탯을 어떻게 나누고 어떤 단위로 찍을지.
//
// 화면(PersonalStats)과 스켈레톤이 같은 정의를 본다. 칸 수를 양쪽에 손으로 적어 두면
// 한쪽만 고쳐 어긋나고, 그때 결과가 도착하는 순간 레이아웃이 튄다.
//
// 홈의 `leaderboardColumns.ts`와 같은 자리다.
import type { LifetimeStats } from "@/types/stats";

/**
 * 값을 어떻게 찍을지. 라벨에 단위 괄호를 달지 않고 값이 단위를 갖는다.
 *
 * `count`는 셀 수 있는 것, `duration`은 초, `distance`는 미터다. PUBG가 초와 미터를
 * 소수점째로 주기 때문에 그냥 찍으면 `최장 생존 1,975.112`가 된다.
 */
export type Unit = "count" | "duration" | "distance";

export interface StatField {
  key: keyof LifetimeStats;
  label: string;
  /** 없으면 `count` */
  unit?: Unit;
}

/**
 * 통산 26개를 성격별로 묶는다.
 *
 * 한 격자에 평평하게 깔아 두면 `판수`와 `수영 거리`가 같은 무게로 보여, 무엇을 먼저 봐야
 * 하는지가 화면에 없다. 26개를 다 읽어야 원하는 값에 닿는다.
 *
 * 접지 않고 나누기만 한 것은 통산 기록을 보러 온 사람이 어차피 다 보고 싶어 하기 때문이다.
 * 몇 개만 크게 띄우고 나머지를 감추면 그걸 한 번 더 누르게 만든다.
 */
export const LIFETIME_GROUPS: { title: string; fields: StatField[] }[] = [
  {
    title: "전적",
    fields: [
      { key: "roundsPlayed", label: "판수" },
      { key: "wins", label: "승리" },
      { key: "losses", label: "패배" },
      { key: "top10s", label: "Top 10" },
      { key: "days", label: "플레이한 날" },
    ],
  },
  {
    title: "전투",
    fields: [
      { key: "kills", label: "킬" },
      { key: "assists", label: "어시스트" },
      { key: "dBNOs", label: "기절시킴" },
      { key: "headshotKills", label: "헤드샷 킬" },
      { key: "damageDealt", label: "누적 딜량" },
      { key: "longestKill", label: "최장 킬", unit: "distance" },
      { key: "roundMostKills", label: "한 판 최다 킬" },
      { key: "maxKillStreaks", label: "최다 연속 킬" },
      { key: "roadKills", label: "차량 킬" },
      { key: "vehicleDestroys", label: "차량 파괴" },
      { key: "teamKills", label: "팀킬" },
      { key: "suicides", label: "자살" },
    ],
  },
  {
    title: "생존·지원",
    fields: [
      { key: "timeSurvived", label: "누적 생존", unit: "duration" },
      { key: "longestTimeSurvived", label: "최장 생존", unit: "duration" },
      { key: "revives", label: "부활시킴" },
      { key: "heals", label: "회복 사용" },
      { key: "boosts", label: "부스트 사용" },
      { key: "weaponsAcquired", label: "주운 무기" },
    ],
  },
  {
    title: "이동",
    fields: [
      { key: "walkDistance", label: "도보", unit: "distance" },
      { key: "rideDistance", label: "탑승", unit: "distance" },
      { key: "swimDistance", label: "수영", unit: "distance" },
    ],
  },
];

/**
 * 무기 표의 열 이름.
 *
 * `킬(전체)`(PUBG의 `StatsTotal`)는 뺐다. 무기별로 신뢰할 수 없는 값이라 수류탄이 일반
 * 490킬인데 전체가 0으로, Mosin은 반대로 뒤집혀 나왔다. 틀린 숫자를 한 칸 더 두는 것보다
 * 없는 편이 낫다.
 */
export const WEAPON_COLUMNS = [
  "무기",
  "Lv",
  "XP",
  "킬(일반)",
  "킬(경쟁)",
  "헤드샷(일반)",
  "딜량(일반)",
  "최장(일반)",
] as const;

/** 생존 마스터리에서 실제로 채워지는 값의 수 */
export const SURVIVAL_CELLS = 4;
