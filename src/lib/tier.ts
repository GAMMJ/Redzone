// 티어 표기 — subTier가 '0'/falsy(Master 등)면 티어만
export function formatTier(tier: string, subTier: string): string {
  return subTier && subTier !== "0" ? `${tier} ${subTier}` : tier;
}
