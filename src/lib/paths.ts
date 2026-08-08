// 플레이어 프로필 경로 — 닉네임은 URL 인코딩
export function playerPath(platform: string, name: string): string {
  return `/player/${platform}/${encodeURIComponent(name)}`;
}
