import { hasSubTier } from "@/lib/pubg/tierAssets";

/**
 * 티어 표기 — "Crystal 2", "Survivor".
 *
 * 예전에는 `subTier`가 `"0"`이거나 falsy일 때만 숫자를 뗐는데, **API는 Master·Survivor에도
 * `subTier: "1"`을 보낸다.** 그래서 "Survivor 1"처럼 없는 등급이 랭킹 페이지 100줄에
 * 그대로 찍혔다. 단계가 있는 티어인지는 `tierAssets`가 정한다 — 아이콘 경로와 같은 판단을
 * 써야 라벨과 그림이 어긋나지 않는다.
 */
export function formatTier(tier: string, subTier: string): string {
  if (!hasSubTier(tier)) return tier;
  return subTier && subTier !== "0" ? `${tier} ${subTier}` : tier;
}
