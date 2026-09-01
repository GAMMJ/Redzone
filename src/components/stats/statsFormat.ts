// 통산 스탯 값을 읽을 수 있는 문자열로.
//
// PUBG는 초와 미터를 소수점째로 준다. 그대로 찍으면 `최장 생존 1,975.112`, `도보 6,881,936.5`가
// 되는데, 자릿수만 늘어나고 알 수 있는 건 그대로다 — 32분 55초와 6,882km면 충분하다.
// 여기서 단위를 값에 붙이므로 라벨에는 괄호를 달지 않는다(`최장 킬(m)`이 아니라 `최장 킬`).

/** 셀 수 있는 값. 소수점이 딸려 와도 정수로 접는다(딜량이 그렇다). */
export function formatCount(value: number): string {
  return Math.round(value).toLocaleString();
}

/**
 * 초 → 사람이 읽는 시간.
 *
 * 자릿수를 두 칸까지만 쓴다. `44일 13시간`이면 충분하고 거기에 분·초를 더 붙이면
 * 다시 읽기 어려워진다. 누적 생존은 수백만 초, 한 판 최장 생존은 수십 분이라
 * 같은 함수가 양쪽을 감당해야 한다.
 */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;

  if (days > 0) return hours > 0 ? `${days.toLocaleString()}일 ${hours}시간` : `${days.toLocaleString()}일`;
  if (hours > 0) return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
  if (minutes > 0) return rest > 0 ? `${minutes}분 ${rest}초` : `${minutes}분`;
  return `${rest}초`;
}

/**
 * 미터 → m 또는 km.
 *
 * 1km 미만은 미터로 둔다 — 최장 킬 634m를 0.6km라고 쓰면 감이 안 온다.
 * 10km 미만은 소수 첫째 자리까지(9.3km), 그 이상은 정수로(6,882km) 접는다.
 */
export function formatDistance(meters: number): string {
  const m = Math.max(0, meters);
  if (m < 1000) return `${Math.round(m).toLocaleString()}m`;
  const km = m / 1000;
  return km < 10 ? `${km.toFixed(1)}km` : `${Math.round(km).toLocaleString()}km`;
}
