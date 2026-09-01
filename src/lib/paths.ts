/**
 * 배그 공식 뉴스 목록.
 *
 * 뉴스를 우리가 옮겨 싣지 않기로 했으므로, 뉴스로 향하는 링크는 헤더·푸터·홈 섹션 어디서
 * 출발하든 전부 여기로 간다. 네 곳에 같은 주소를 적어 두면 배그가 주소를 바꿀 때
 * 하나를 빠뜨리게 되고, 빠뜨린 그 링크는 죽은 채로 남아도 티가 안 난다.
 */
export const PUBG_NEWS_URL = "https://pubg.com/ko/news";

/**
 * 공지 하나의 한국어 페이지. 번호는 스팀 공지 본문에서 뽑은 것이다.
 *
 * 이 주소는 캐시에 담지 않고 번호에서 만든다. 주소를 담아 두면 캐시에서 나온 문자열이
 * 그대로 `<a href>`에 앉는데, 그게 어쩌다 `javascript:`가 되면 막을 것이 없다.
 * 번호만 담고(숫자인지 검사한다) 주소는 여기서 조립하면 그 길이 아예 없다.
 */
export function pubgNewsPath(articleId: string): string {
  return `${PUBG_NEWS_URL}/${articleId}`;
}

/**
 * 사이트 밖으로 나가는 주소인가.
 *
 * 주소만 보고 안팎을 가른다. 따로 플래그를 두면 링크를 더할 때마다 둘을 맞춰 줘야 하고,
 * 어긋나면 사이트 안을 새 탭으로 열거나 바깥을 라우터로 넘기게 된다.
 *
 * Header와 Footer가 각각 같은 판정을 갖고 있었다. 한 벌로 모아 둬야 "외부 링크는 이렇게
 * 연다"는 규칙이 한 곳에서만 바뀐다.
 */
export function isExternalHref(href: string): boolean {
  return href.startsWith("http");
}

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
