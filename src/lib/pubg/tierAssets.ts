// 티어 아이콘 경로와 "단계가 있는 티어인가"를 한자리에서 정한다.
//
// 이미지는 96x96 webp로 사전 압축해 public/tiers/ 에 뒀다
// (만든 방법: docs/local/scratch/build-tier-assets.mjs).
// mapAssets.ts와 같은 방식이다 — 경로를 만드는 곳을 하나로 두면 파일명 규칙이 흩어지지 않는다.

/** public/tiers/ 이미지 한 변 길이(px). 화면에서 20~56px로 그리므로 2배수면 충분하다. */
export const TIER_ICON_SIZE = 96;

/**
 * 단계(1~4)가 없는 티어.
 *
 * **API는 이 둘에도 `subTier: "1"`을 보낸다.** 그대로 믿으면 "Survivor 1"이 되는데
 * 그런 등급은 없다. 랭킹 페이지 100줄이 전부 그렇게 나오고 있었다.
 *
 * 라벨과 아이콘 경로가 각자 판단하면 "Survivor 1"이라 써 놓고 아이콘은 survivor.webp를
 * 쓰는 식으로 어긋나므로, 판단을 여기 하나만 둔다.
 */
const TIERS_WITHOUT_SUB = new Set(["master", "survivor"]);

/** 아이콘이 준비된 티어. 여기 없으면 이미지를 걸지 않는다(아래 tierIconPath 주석 참고). */
const KNOWN_TIERS = new Set([
  "bronze",
  "silver",
  "gold",
  "platinum",
  "crystal",
  "diamond",
  "master",
  "survivor",
  "unranked",
]);

/**
 * 티어별 색 클래스. 토큰은 globals.css의 `--color-tier-*`.
 *
 * 등급이 색으로 먼저 읽히게 하려는 것이다. 카드 셋을 나란히 놓았을 때 글자를 읽기 전에
 * 스쿼드만 크리스탈이라는 게 보인다. 모르는 티어는 중립색으로 떨어뜨린다.
 *
 * Tailwind는 클래스 이름을 소스에서 그대로 찾아내므로 문자열을 조립하면 안 된다
 * (`text-tier-${name}-fg`는 빌드에서 사라진다). 그래서 전부 적어 둔다.
 */
const TIER_STYLE: Record<string, { fg: string; bg: string; fill: string }> = {
  bronze: { fg: "text-tier-bronze-fg", bg: "bg-tier-bronze-bg", fill: "bg-tier-bronze-fg" },
  silver: { fg: "text-tier-silver-fg", bg: "bg-tier-silver-bg", fill: "bg-tier-silver-fg" },
  gold: { fg: "text-tier-gold-fg", bg: "bg-tier-gold-bg", fill: "bg-tier-gold-fg" },
  platinum: { fg: "text-tier-platinum-fg", bg: "bg-tier-platinum-bg", fill: "bg-tier-platinum-fg" },
  crystal: { fg: "text-tier-crystal-fg", bg: "bg-tier-crystal-bg", fill: "bg-tier-crystal-fg" },
  diamond: { fg: "text-tier-diamond-fg", bg: "bg-tier-diamond-bg", fill: "bg-tier-diamond-fg" },
  master: { fg: "text-tier-master-fg", bg: "bg-tier-master-bg", fill: "bg-tier-master-fg" },
  survivor: { fg: "text-tier-survivor-fg", bg: "bg-tier-survivor-bg", fill: "bg-tier-survivor-fg" },
  unranked: {
    fg: "text-tier-unranked-fg",
    bg: "bg-tier-unranked-bg",
    fill: "bg-tier-unranked-fg",
  },
};

const NEUTRAL_STYLE = TIER_STYLE.unranked;

export function tierStyle(tier: string): { fg: string; bg: string; fill: string } {
  return TIER_STYLE[tier.trim().toLowerCase()] ?? NEUTRAL_STYLE;
}

/**
 * 한 단계(division)의 폭. 2025-06 업데이트 36.1에서 티어당 4단계 × 100 RP가 됐다.
 *
 * 구간이 100 단위로 딱 떨어진다는 것은 실제 응답으로 확인했다. kjkj9811의
 * `currentTier: Gold 1 / 2154`와 `bestTier: Platinum 4 / 2236`이 그 근거다 —
 * 구간이 100씩 어긋나 있었다면 2236은 Platinum 4가 아니라 Gold 1이었어야 한다.
 */
const DIVISION_RP = 100;

/**
 * 다음 단계까지 남은 RP와 지금 단계에서의 진행률(0~1).
 *
 * 단계가 없는 티어(Master·Survivor)나 값이 이상하면 `null` — 바를 그리지 않는다.
 * RP만 보여 주면 "얼마나 더 올려야 하는지"를 스스로 계산해야 한다.
 */
export function divisionProgress(
  tier: string,
  rankPoint: number,
): { ratio: number; remaining: number } | null {
  if (!hasSubTier(tier)) return null;
  if (!Number.isFinite(rankPoint) || rankPoint <= 0) return null;
  const within = rankPoint % DIVISION_RP;
  return { ratio: within / DIVISION_RP, remaining: DIVISION_RP - within };
}

/** 단계가 있는 티어인가. Master·Survivor만 없다. */
export function hasSubTier(tier: string): boolean {
  return !TIERS_WITHOUT_SUB.has(tier.trim().toLowerCase());
}

/**
 * 티어 아이콘 경로. 모르는 티어면 `null`.
 *
 * `null`을 돌려주는 쪽이 중요하다. PUBG는 티어를 늘린 적이 있다 — 2025년 6월에 Crystal이
 * Platinum과 Diamond 사이에 들어왔다. 다음에 또 늘면 우리에겐 그 이미지가 없는데,
 * 경로를 만들어 걸면 404 요청과 깨진 이미지가 남는다. 텍스트만 나오는 편이 낫다.
 *
 * 파일명은 API가 주는 값을 소문자로 바꾼 것뿐이다:
 * `{ tier: "Gold", subTier: "1" }` → `/tiers/gold-1.webp`
 */
export function tierIconPath(tier: string, subTier: string): string | null {
  const name = tier.trim().toLowerCase();
  if (!KNOWN_TIERS.has(name)) return null;
  if (!hasSubTier(name)) return `/tiers/${name}.webp`;

  // 단계는 1~4다(2025-06 업데이트 36.1에서 5개 → 4개). 벗어난 값은 옛 시즌 데이터이거나
  // 형식이 바뀐 것이라 맞는 그림을 고를 수 없다.
  const step = Number(subTier);
  if (!Number.isInteger(step) || step < 1 || step > 4) return null;
  return `/tiers/${name}-${step}.webp`;
}
