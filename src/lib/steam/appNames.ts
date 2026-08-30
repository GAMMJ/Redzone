// appid → 게임 이름.
//
// 접속자 순위표에는 숫자만 온다. 이름은 스토어에서 따로 받아야 하는데, 게임 이름은 거의
// 바뀌지 않으므로 오래 캐시한다. 순위권에 새 게임이 올라온 날에만 한 번 부르고 그 뒤로는
// 캐시에서 나온다.
import "server-only";
import { readCachedValue, writeCachedValue } from "@/lib/pubgProxy";
import { fetchJsonWithTimeout } from "@/lib/steam/fetchJson";

/**
 * `appids`에 여러 개를 넣으면 `null`이 온다 — 한 번에 하나씩이다.
 *
 * `filters=basic`으로 줄인다. 안 줄이면 상세 설명까지 5KB가 딸려 온다. `filters=name`은
 * 이름만 주는 게 아니라 전부 지운 빈 배열을 준다.
 */
const DETAILS_URL = "https://store.steampowered.com/api/appdetails";

/**
 * 지역을 못 박는다.
 *
 * 안 박으면 부르는 쪽 IP로 스팀이 알아서 정한다 — 배포 리전이 바뀌면 이름이 같이 바뀐다.
 * 실측: 기본은 `Palworld`, `l=korean`은 `Palworld / 팰월드`다. 이름이 30일 캐시에 굳으므로
 * 한 번 섞이면 판 번호를 손으로 올리기 전엔 안 풀린다.
 *
 * 영어로 고정한다. 한국어 이름은 위처럼 두 언어를 슬래시로 붙여 주는 게 섞여 있어 표가
 * 지저분해진다. 대부분의 게임 이름은 어차피 영문이다.
 */
const LOCALE = "&l=english&cc=us";

/**
 * 이름 전체를 한 키에 모아 둔다.
 *
 * appid마다 키를 따로 두면 순위표를 채울 때마다 Redis GET이 열 번 나간다. 무료 한도가 월
 * 50만 명령인데 그중 십만 가까이를 이름 읽기로만 태우게 된다. 한 덩어리로 두면 GET 한 번이다.
 *
 * 담는 모양을 바꾸면 번호를 올릴 것.
 */
const CACHE_KEY = "steam:appnames:v2";

/** 이름은 거의 안 바뀐다. 30일. */
const TTL = 60 * 60 * 24 * 30;

/** 스토어가 굼떠도 순위표 자체는 나와야 한다 */
const TIMEOUT = 5000;

type NameMap = Record<string, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** 캐시에서 꺼낸 덩어리를 쓸 수 있는 모양으로 정리한다. 어긋난 항목은 버린다. */
function toNameMap(raw: unknown): NameMap {
  if (!isRecord(raw)) return {};
  const map: NameMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.length > 0) map[key] = value;
  }
  return map;
}

/** 응답에서 이름 한 개를 꺼낸다. 형태가 어긋나면 null. */
function parseName(raw: unknown, appid: number): string | null {
  if (!isRecord(raw)) return null;
  const entry = raw[String(appid)];
  if (!isRecord(entry) || entry.success !== true || !isRecord(entry.data)) return null;
  const { name } = entry.data;
  return typeof name === "string" && name.length > 0 ? name : null;
}

async function fetchName(appid: number): Promise<string | null> {
  const url = `${DETAILS_URL}?appids=${appid}&filters=basic${LOCALE}`;
  return parseName(await fetchJsonWithTimeout(url, TIMEOUT), appid);
}

/**
 * 여러 appid의 이름을 한꺼번에. 못 찾은 것은 결과에서 빠진다 — 호출부가 숫자로 대신 쓴다.
 *
 * Redis는 덩어리 하나를 읽고, 새로 받은 게 있을 때만 한 번 쓴다. 스토어 조회는 캐시에 없는
 * appid에 대해서만, 병렬로 한다 — 열 개를 줄줄이 부르면 그만큼 화면이 늦어진다.
 */
export async function getAppNames(appids: number[]): Promise<Map<number, string>> {
  const unique = [...new Set(appids)];
  const known = toNameMap(await readCachedValue<unknown>(CACHE_KEY));

  const missing = unique.filter((id) => known[String(id)] === undefined);
  if (missing.length > 0) {
    const fetched = await Promise.all(missing.map((id) => fetchName(id)));
    // 실패한 것은 안 담는다 — 다음 갱신 때 다시 시도한다.
    const added: NameMap = {};
    missing.forEach((id, i) => {
      const name = fetched[i];
      if (name) added[String(id)] = name;
    });

    if (Object.keys(added).length > 0) {
      Object.assign(known, added);
      // 쓰기 직전에 다시 읽어 합친다. 읽고-고치고-쓰는 사이 다른 요청이 먼저 썼으면 그 쪽이
      // 통째로 덮여 사라진다. 잃어도 다음 미스에서 다시 받아 오는 정도라 큰일은 아니지만,
      // 캐시가 빈 채로 동시 접속이 몰리는 첫 배포 때 스토어를 그만큼 더 두드리게 된다.
      await writeCachedValue(CACHE_KEY, { ...toNameMap(await readCachedValue<unknown>(CACHE_KEY)), ...added }, TTL);
    }
  }

  const found = new Map<number, string>();
  for (const id of unique) {
    const name = known[String(id)];
    if (name) found.set(id, name);
  }
  return found;
}
