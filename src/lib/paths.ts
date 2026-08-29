// 플레이어 프로필 경로 — 닉네임은 URL 인코딩
export function playerPath(platform: string, name: string): string {
  return `/player/${platform}/${encodeURIComponent(name)}`;
}

/**
 * 통계 페이지 경로.
 *
 * 전적과 달리 닉네임을 경로가 아니라 쿼리에 싣는다. 탭(`?tab=`)·모드(`?mode=`)도 함께
 * 실려야 하는데 둘을 경로와 쿼리로 나눠 두면 링크를 만들 때마다 규칙이 갈라진다.
 */
export function statsPath(platform: string, name: string, tab?: string, mode?: string): string {
  const params = new URLSearchParams({ platform, player: name });
  if (tab) params.set("tab", tab);
  if (mode) params.set("mode", mode);
  return `/stats?${params.toString()}`;
}
