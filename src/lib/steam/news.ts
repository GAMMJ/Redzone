// 배그 공지 조회.
//
// 스팀이 쓴 글이 아니라 배그 팀이 자기 스팀 상점 페이지에 올리는 공식 공지다.
// pubg.com 한국어 뉴스와 같은 글의 영어 원문이라, 본문에서 기사 번호를 뽑아
// 한국어 페이지로 연결한다 — 제목은 영어, 눌러 들어가면 한국어.
//
// 한국어 목록을 직접 긁는 쪽은 막혀 있다. pubg.com은 Nuxt로 그려지는데 목록의 <a>에
// href가 아예 없어서, 제목을 얻어도 어디로 보낼지를 못 만든다.
import "server-only";
import { readCachedValue, writeCachedValue, writeCachedValueIfAbsent } from "@/lib/pubgProxy";
import { fetchJsonWithTimeout } from "@/lib/steam/fetchJson";

/** PUBG: BATTLEGROUNDS의 스팀 appid */
const PUBG_APP_ID = 578080;

/**
 * `feeds`로 공식 공지만 남긴다.
 *
 * 안 걸면 스팀이 묶어 주는 외부 게임 매체 기사(PCGamesN 등)가 섞인다. 배그 팀이 쓴 글이
 * 아닌 것을 "최신 PUBG 뉴스"라고 내보낼 이유가 없다.
 *
 * `maxlength`는 쓰지 않는다. 응답을 156KB → 11.6KB로 줄여 주지만 BBCode를 벗기면서
 * `[url=...]`을 통째로 지운다 — count=30 기준 링크 추출이 9건에서 0건이 된다.
 * 링크가 이 기능의 핵심이라 본문을 그대로 받는다(실측 13~98ms).
 *
 * 30건을 받는 이유는 3건을 채우기 위해서다. 대회 기간에는 목록 대부분이 중계 안내라
 * 링크 달린 항목이 드물게 깔린다(최근 30건 중 9건).
 */
const NEWS_URL =
  `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/` +
  `?appid=${PUBG_APP_ID}&count=30&feeds=steam_community_announcements`;

/**
 * 캐시 TTL — 3시간.
 *
 * 비용으로 정한 값이 아니다. 1시간과 6시간의 월 Redis 명령 차이가 600회(무료 한도의 0.12%)라
 * 어느 쪽도 비용으로는 구분되지 않는다. 순전히 "새 공지가 얼마나 늦게 떠도 되는가"다.
 * 실측상 공지는 1.2일에 한 건 올라오고, 이 값이면 평균 1시간 30분 늦게 뜬다.
 */
const TTL = 60 * 60 * 3;

/** 담는 필드를 바꾸면 올릴 것 — 옛 캐시에는 새 필드가 없다 */
const CACHE_KEY = "steam:news:v2";

/** 응답 없는 소켓 하나가 홈을 붙잡지 못하게 한다 */
const TIMEOUT = 5000;

/**
 * 실패를 기억해 두는 시간 — 5분.
 *
 * 성공 TTL(3시간)보다 훨씬 짧게 잡는다. 스팀이 돌아왔는데 세 시간을 더 기다리게 할 이유가 없다.
 */
const FAIL_TTL = 60 * 5;

/** 카드 개수. 홈 그리드가 3열이라 한 줄로 떨어진다. */
export const CARD_COUNT = 3;

/**
 * 본문에 박힌 공식 기사 링크.
 *
 * 스팀 공지는 대개 `[url=https://pubg.com/news/10974]Read the full announcement here![/url]`로
 * 원문을 가리킨다. 여기서 뽑은 번호가 한국어 페이지의 번호와 같다.
 * 지역 조각(`/en/`, `/pt-BR/`)이 낀 것도 있어 선택적으로 흘린다.
 *
 * 앞의 `(?:^|[^\w.-])`가 호스트 왼쪽 경계다. 이게 없으면 `pubg.com`이 남의 호스트 꼬리에
 * 걸린다 — `notpubg.com/news/999`와 `cdn.pubg.com/news/1`이 둘 다 매치됐다(실측). 게다가
 * `exec`는 첫 매치만 주므로, 본문 앞쪽에 그런 주소가 하나라도 있으면 진짜 기사 번호를
 * 놓치고 엉뚱한 번호로 링크가 나간다. 링크가 살아 있어 화면에는 티가 안 난다.
 *
 * 중첩 수량자가 없어 ReDoS는 없다(`a-` 6만 개에 0ms).
 */
const ARTICLE_LINK = /(?:^|[^\w.-])(?:www\.)?pubg\.com\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?news\/(\d+)/i;

export interface NewsItem {
  /**
   * 기사 번호. 제목이 겹쳐도(주간 제재 안내 등) 이걸로 가른다.
   *
   * 숫자만 담고 주소는 담지 않는다 — 화면이 `pubgNewsPath`로 조립한다.
   */
  id: string;
  /** 공지 제목. 글로벌 피드라 영어다. */
  title: string;
  /** 게시 시각 (유닉스 초) */
  date: number;
  /** 제목에서 추린 분류 */
  category: string;
}

/**
 * 제목에서 분류를 추린다.
 *
 * 응답의 `feedlabel`은 전부 "Community Announcements"라 카드 태그로 쓸 수 없다.
 * 스팀이 분류를 안 주므로 제목에서 읽어낸다. 못 알아보면 "공지"다 — 틀린 이름을 붙이느니
 * 뭉뚱그리는 편이 낫고, 어차피 실제로 그것들은 공지다.
 *
 * **적은 순서가 곧 우선순위다.** 배그는 패치 날 여러 글을 한꺼번에 올리는데, 실측상
 * 상점·패치노트·맵 리포트가 초 단위까지 같은 시각(08-11 15:00)에 찍혀 나온다.
 * 날짜만으로 줄을 세우면 그 셋의 순서는 스팀이 넘겨준 순서에 맡겨지고, 실제로 그때
 * 패치노트가 상점 업데이트 뒤로 밀렸다. 전적 사이트에서 제일 값나가는 글이 패치노트다.
 */
const CATEGORIES: ReadonlyArray<{ match: RegExp; label: string }> = [
  { match: /patch notes/i, label: "패치 노트" },
  { match: /dev letter/i, label: "데브레터" },
  { match: /store update/i, label: "상점" },
  { match: /map service report/i, label: "맵" },
  { match: /bans notice/i, label: "제재" },
];

/** 어디에도 안 걸리는 글. 우선순위는 맨 뒤다. */
const OTHER = "공지";

function categoryOf(title: string): string {
  return CATEGORIES.find(({ match }) => match.test(title))?.label ?? OTHER;
}

function rankOf(category: string): number {
  const index = CATEGORIES.findIndex(({ label }) => label === category);
  return index === -1 ? CATEGORIES.length : index;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * 응답 한 줄에서 카드 하나를 만든다.
 *
 * 기사 링크가 없으면 버린다. 이게 소음 필터를 겸한다 — 최근 30건 중 스무 건 남짓이
 * "PUBG GLOBAL SERIES 9 GRAND FINALS DAY 3 IS LIVE!" 같은 중계 안내인데, 그것들은
 * 원문 기사가 없어 링크도 없다. 거르지 않으면 대회 기간 내내 카드 세 장이 전부
 * DAY 1·2·3이 된다. 남는 것은 패치노트·데브레터·상점 업데이트 쪽이다.
 */
function parseItem(raw: unknown): NewsItem | null {
  if (!isRecord(raw)) return null;
  const { title, contents, date } = raw;
  if (typeof title !== "string" || title.length === 0) return null;
  if (typeof contents !== "string" || !isPostedAt(date)) return null;

  const id = ARTICLE_LINK.exec(contents)?.[1];
  if (!id) return null;

  return { id, title, date, category: categoryOf(title) };
}

/**
 * 게시 시각으로 쓸 수 있는 값인가.
 *
 * `typeof === "number"`로 끝내면 안 된다. 화면에서 이 값이 `Intl.DateTimeFormat`에 들어가는데,
 * 범위를 벗어난 수를 넘기면 **RangeError를 던진다**(실측: `1e21`, `NaN` 모두 throw).
 * `Suspense`는 에러를 잡지 않으므로 그 예외는 오류 경계까지 올라가 홈을 통째로 죽인다 —
 * 뉴스가 실패해도 Hero·랭킹은 살려 두려고 만든 구조가 그 한 값에 무너진다. 게다가 그 값이
 * 캐시에 굳으면 세 시간 간다.
 *
 * 그리는 값은 타입이 아니라 범위까지 본다. 형제 파일 `onlinePlayers.ts`의 `parseRow`와 같은 태도다.
 */
function isPostedAt(value: unknown): value is number {
  // 상한은 서기 3000년 언저리. 유닉스 초로 들어와야 할 자리에 밀리초가 오는 것도 함께 걸린다.
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value < 3e10;
}

function isNewsItem(value: unknown): value is NewsItem {
  if (!isRecord(value)) return false;
  const { id, title, date, category } = value;
  // 번호는 주소로 조립되므로 숫자만 통과시킨다.
  if (typeof id !== "string" || !/^\d+$/.test(id)) return false;
  if (typeof title !== "string" || title.length === 0) return false;
  if (typeof category !== "string" || category.length === 0) return false;
  return isPostedAt(date);
}

/**
 * 캐시에서 꺼낸 값이 지금 모양인지. 스팀 응답이 아니라 우리가 저장한 것을 검사한다.
 *
 * 성공값은 배열, 실패 표시는 객체다. 같은 키에 담아 두므로 이 둘이 서로를 통과하지 못하는
 * 것이 중요하다 — 배열인지부터 보는 이유다.
 *
 * 빈 배열도 통과시킨다. "스팀은 멀쩡한데 뽑을 글이 없다"는 정상적인 결과이고, 그걸
 * 실패로 접으면 화면이 거짓 원인을 말하는 데다 5분마다 스팀을 다시 두드리게 된다.
 */
function isNews(value: unknown): value is NewsItem[] {
  return Array.isArray(value) && value.every(isNewsItem);
}

/** 조금 전 조회가 실패했다는 표시. 성공값과 같은 키를 쓰므로 둘을 가려낼 수 있어야 한다. */
function isFailureMark(value: unknown): boolean {
  return isRecord(value) && typeof value.failedAt === "number";
}

/**
 * 카드에 올릴 세 장을 고른다.
 *
 * 최신순 정렬 → 같은 기사 접기 → 카테고리당 한 장 → 모자라면 채우기 → 날짜로 재정렬.
 * 각 단계가 왜 필요한지는 아래 함수들에 적어 뒀다.
 */
function selectItems(items: NewsItem[]): NewsItem[] {
  // 스팀이 최신순으로 준다는 것은 관측일 뿐 문서가 아니다. 코드가 보증하게 한다.
  const ordered = dedupeById([...items].sort(byDateThenCategory));
  const oneEach = takeOnePerCategory(ordered);

  // 자른 뒤 날짜로 다시 세운다. 앞의 두 묶음이 각각은 최신순이어도 이어 붙이면 아니다 —
  // 폴백이 도는 순간 3번 카드가 2번보다 일주일 최신인 일이 생긴다(실측).
  // "최신 뉴스"에서 사용자가 기대하는 정렬은 날짜 하나뿐이다.
  return fillUpTo(oneEach, ordered, CARD_COUNT).sort(byDateThenCategory);
}

function byDateThenCategory(a: NewsItem, b: NewsItem): number {
  return b.date - a.date || rankOf(a.category) - rankOf(b.category);
}

/**
 * 같은 기사를 가리키는 항목을 하나로 접는다. 앞선 것이 남는다.
 *
 * 배그는 패치 날 여러 글을 올리고 각각 원문 하나를 링크한다. 제목이 달라 분류가 갈리면
 * 아래 `takeOnePerCategory`를 둘 다 통과해서, 같은 링크로 가는 카드가 두 장 뜨고
 * React key까지 겹친다. 정렬된 목록을 받으므로 살아남는 쪽이 더 최신이고 더 앞순위다.
 */
function dedupeById(items: NewsItem[]): NewsItem[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

/**
 * 카테고리마다 첫 한 장씩만 남긴다.
 *
 * 안 그러면 "주간 제재 현황 안내"가 섹션을 차지한다 — 매주 올라오는 데다 링크를 꼬박꼬박
 * 달고 나와서, 날짜순으로 자르면 세 장 중 두 장이 제재 안내가 된다(실측).
 * 정기 행정 공지가 패치노트를 밀어내는 셈이다.
 */
function takeOnePerCategory(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.category)) return false;
    seen.add(item.category);
    return true;
  });
}

/**
 * 고른 것이 모자라면 후보에서 채워 `limit`장을 맞춘다.
 *
 * 카테고리가 모자란 시기에 빈자리를 남기느니 같은 분류라도 한 장 더 올리는 편이 낫다.
 */
function fillUpTo(chosen: NewsItem[], candidates: NewsItem[], limit: number): NewsItem[] {
  const taken = new Set(chosen.map((item) => item.id));
  const rest = candidates.filter((item) => !taken.has(item.id));
  return [...chosen, ...rest].slice(0, limit);
}

/**
 * 응답에서 카드 세 장을 꺼낸다. **응답 자체가 어긋날 때만** null이다.
 *
 * 목록은 멀쩡한데 링크 달린 글이 하나도 없는 경우는 빈 배열로 돌려준다. 이 둘을 뭉뚱그려
 * null로 접으면 화면이 "불러오지 못했습니다"라고 거짓 원인을 말하고, 실패 표시가 앉으면서
 * 스팀 조회가 하루 8회에서 288회로 뛴다. `LoadFailure`가 "없음"과 "못 불러옴"을 가려
 * 말하려고 만든 컴포넌트라 더더욱 섞으면 안 된다.
 */
function parseNews(raw: unknown): NewsItem[] | null {
  if (!isRecord(raw) || !isRecord(raw.appnews)) return null;
  const { newsitems } = raw.appnews;
  if (!Array.isArray(newsitems)) return null;

  const parsed = newsitems.map(parseItem).filter((item): item is NewsItem => item !== null);
  return selectItems(parsed);
}

/**
 * 홈에 띄울 공지. 실패하면 null이고 호출부가 대체 문구를 그린다.
 *
 * 스팀은 키가 없으므로 `/api/pubg` 프록시를 거치지 않는다. 그 규칙은 `PUBG_API_KEY`를
 * 클라에 노출하지 않으려고 있는데 여기엔 감출 것이 없고, 호출부가 서버 컴포넌트라
 * 라우트 핸들러를 한 겹 두면 자기 자신에게 HTTP를 왕복하는 낭비만 남는다. 대신
 * `server-only`로 클라 유입을 빌드 타임에 막는다.
 *
 * 홈은 `force-dynamic`이라 Next 데이터 캐시가 통째로 꺼져 있다(`fetch`에 `revalidate`를
 * 붙여도 `no-store`로 덮인다). Redis가 유일한 방패다.
 */
export async function getNews(): Promise<NewsItem[] | null> {
  // 캐시에서 온 값도 모양을 본다. 키에 판 번호를 붙여 두긴 했지만, 그것만 믿으면 옛 모양이
  // 하나라도 남아 있을 때 홈이 통째로 죽는다. 어긋난 값은 없는 셈 치고 다시 받아오면 그만이다.
  const cached = await readCachedValue<unknown>(CACHE_KEY);
  if (isNews(cached)) return cached;

  // 조금 전에 실패했으면 스팀을 또 두드리지 않는다.
  //
  // 실패 표시를 성공값과 같은 키에 담는 것이 요점이다. 키를 따로 두면 잘 되는 동안에도
  // 조회마다 GET이 한 번씩 더 나가 평상시 비용이 두 배가 된다. 여기 담으면 읽기는 한 번 그대로다.
  if (isFailureMark(cached)) return null;

  const parsed = parseNews(await fetchJsonWithTimeout(NEWS_URL, TIMEOUT));
  if (!parsed) {
    // 내가 실패하는 사이 다른 요청이 성공했을 수 있다. 그 값을 덮지 않는다.
    //
    // 실패 표시가 성공값과 같은 키에 앉으므로, 확인 없이 쓰면 늦게 실패한 요청이 먼저
    // 성공한 요청의 스냅샷을 지운다. 스팀이 멀쩡한데도 5분간 뉴스가 비게 된다.
    //
    // 조건은 Redis에 맡긴다. 여기서 한 번 읽어 보고 판단하면 읽기와 쓰기 사이의 왕복
    // 한 번이 그대로 창으로 남아, 하필 그 몇 ms에 성공값이 들어오면 똑같이 지운다.
    if (await writeCachedValueIfAbsent(CACHE_KEY, { failedAt: Date.now() }, FAIL_TTL)) return null;

    // 못 썼다 = 그 자리에 이미 뭔가 있다. 성공값이면 그걸 쓴다.
    const fresh = await readCachedValue<unknown>(CACHE_KEY);
    return isNews(fresh) ? fresh : null;
  }

  await writeCachedValue(CACHE_KEY, parsed, TTL);
  return parsed;
}
