// 스팀 동시 접속자 조회.
//
// PUBG API에는 접속자 엔드포인트가 아예 없다. 이 숫자를 주는 곳은 스팀뿐이고,
// 그래서 이 값은 영원히 "스팀 PC 기준"이다 — 카카오·콘솔은 셀 방법이 없다.
// 화면에서 그 사실을 반드시 같이 말해야 한다.
import "server-only";
import { readCachedValue, writeCachedValue } from "@/lib/pubgProxy";
import { getAppNames } from "@/lib/steam/appNames";
import { fetchJsonWithTimeout } from "@/lib/steam/fetchJson";

/** PUBG: BATTLEGROUNDS의 스팀 appid */
export const PUBG_APP_ID = 578080;

/**
 * 스팀 동시 접속 상위 100개.
 *
 * 접속자만 주는 `GetNumberOfCurrentPlayers`도 있지만 이쪽을 쓴다. 한 번의 응답에 접속자와
 * 순위가 함께 들어 있어서다. 숫자 하나만 있으면 대부분은 10만이 많은 건지 적은 건지 모른다.
 */
const CHARTS_URL =
  "https://api.steampowered.com/ISteamChartsService/GetGamesByConcurrentPlayers/v1/";

/**
 * 캐시 TTL — 5분.
 *
 * 스팀 자체가 이 정도 간격으로 갱신한다(응답의 `last_update`가 관측 시점 기준 228초 전이었다).
 * 더 짧게 잡아 봐야 같은 숫자를 다시 받아오며 남의 서버만 두드린다.
 */
const TTL = 60 * 5;

/** 담는 필드를 바꾸면 올릴 것 — 옛 캐시에는 새 필드가 없다 */
const CACHE_KEY = "steam:online:v3";

/** 응답 없는 소켓 하나가 통계 페이지를 붙잡지 못하게 한다 */
const TIMEOUT = 5000;

/**
 * 실패를 기억해 두는 시간 — 1분.
 *
 * 성공 TTL(5분)보다 짧게 잡는다. 스팀이 돌아왔는데 5분을 더 기다리게 할 이유가 없다.
 */
const FAIL_TTL = 60;

/**
 * 이름 조회에 주는 시간 — 2초.
 *
 * 이름은 없으면 숫자로 대신 쓰는 값이라, 이것 때문에 접속자 숫자가 늦어지면 안 된다.
 */
const NAME_BUDGET = 2000;

/**
 * 순위표에 몇 줄을 남길 것인가.
 *
 * 응답은 100개가 오지만 100줄짜리 표는 아무도 안 읽는다. 열 줄이면 PUBG(6위 언저리)가
 * 늘 들어가고, 위로 몇 계단인지도 보인다.
 */
const TOP_GAMES = 10;

export interface GameRow {
  appid: number;
  /** 스팀 전체 순위 */
  rank: number;
  /** 현재 동시 접속자 수 */
  count: number;
  /** 최근 24시간 최고치 */
  peak: number;
  /**
   * 게임 이름. 스토어에서 못 받았으면 없다 — 화면이 숫자로 대신 쓴다.
   *
   * 스냅샷 안에 같이 담는다. 이름은 5분간 안 바뀌는 이 값에 딸린 것인데 따로 읽으면
   * 조회 한 번에 Redis 명령이 열 개 더 붙는다. 여기 구워 두면 캐시 히트가 GET 한 번이다.
   */
  name?: string;
}

export interface OnlinePlayers {
  /** PUBG 한 줄 */
  pubg: GameRow;
  /** 접속자 많은 순 상위 몇 개. PUBG가 이 안에 들어 있을 수 있다. */
  top: GameRow[];
  /** 스팀이 이 값을 집계한 시각 (유닉스 초) */
  updatedAt: number;
}

// 스팀은 없는 appid에도 200과 `{"response":{"result":42}}`를 준다 — 필드가 통째로 빠진다.
// 상태 코드와 JSON 파싱 성공은 값이 있다는 뜻이 아니므로, 쓸 필드를 하나씩 확인한다.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** 순위표 한 줄. 쓸 네 값이 다 숫자로 와야 한다. */
function parseRow(raw: unknown): GameRow | null {
  if (!isRecord(raw)) return null;
  const { appid, rank, concurrent_in_game: count, peak_in_game: peak } = raw;
  if (typeof appid !== "number" || typeof rank !== "number") return null;
  if (typeof count !== "number" || typeof peak !== "number") return null;
  return { appid, rank, count, peak };
}

function isGameRow(value: unknown): value is GameRow {
  if (!isRecord(value)) return false;
  const { appid, rank, count, peak, name } = value;
  if (typeof appid !== "number" || typeof rank !== "number") return false;
  if (typeof count !== "number" || typeof peak !== "number") return false;
  return name === undefined || typeof name === "string";
}

/** 캐시에서 꺼낸 값이 지금 모양인지. 스팀 응답이 아니라 우리가 저장한 것을 검사한다. */
function isOnlinePlayers(value: unknown): value is OnlinePlayers {
  if (!isRecord(value)) return false;
  const { pubg, top, updatedAt } = value;
  if (typeof updatedAt !== "number" || !isGameRow(pubg)) return false;
  // 모양만 보면 아무 게임 줄이나 통과한다. 담는 게임을 바꾸면서 키 번호를 안 올리면
  // 남의 접속자를 PUBG 숫자라고 우기게 되는데, 그 실패는 화면에 티가 안 난다.
  if (pubg.appid !== PUBG_APP_ID) return false;
  // 빈 배열에 every를 걸면 무조건 참이다. 빈 표가 정상으로 통과하지 않게 길이부터 본다.
  return Array.isArray(top) && top.length > 0 && top.every(isGameRow);
}

/** 조금 전 조회가 실패했다는 표시. 성공값과 같은 키를 쓰므로 둘을 가려낼 수 있어야 한다. */
function isFailureMark(value: unknown): boolean {
  return isRecord(value) && typeof value.failedAt === "number";
}

/**
 * 응답에서 PUBG 한 줄과 상위 몇 줄을 꺼낸다. 형태가 어긋나거나 PUBG가 없으면 null.
 *
 * 목록은 상위 100개다. 꼴찌가 12,103명이고 PUBG는 104,737명(6위)이라, 목록 밖으로 밀리려면
 * 여덟 배 넘게 빠져야 한다. 그 경우까지 두 번째 엔드포인트로 받아내는 대신 null로 돌려
 * 화면이 "못 불러왔다"고 말하게 둔다 — 일어나지 않을 일에 짠 코드는 영영 검증되지 않는다.
 */
function parseOnlinePlayers(raw: unknown): OnlinePlayers | null {
  if (!isRecord(raw) || !isRecord(raw.response)) return null;
  const { ranks, last_update: updatedAt } = raw.response;
  if (!Array.isArray(ranks) || typeof updatedAt !== "number") return null;

  // 한 줄이 깨졌다고 표 전체를 버리지 않는다. PUBG 줄만 반드시 있어야 한다.
  const rows = ranks.map(parseRow).filter((row): row is GameRow => row !== null);
  const pubg = rows.find((row) => row.appid === PUBG_APP_ID);
  if (!pubg) return null;

  // 스팀이 순위대로 준다는 것은 관측일 뿐 문서가 아니다. 코드가 보증하게 한다.
  const top = [...rows].sort((a, b) => a.rank - b.rank).slice(0, TOP_GAMES);
  return { pubg, top, updatedAt };
}

/**
 * 현재 접속자·순위. 실패하면 null이고 호출부가 "못 불러왔다"를 그린다.
 *
 * 스팀은 키가 없으므로 `/api/pubg` 프록시를 거치지 않는다. 그 규칙은 `PUBG_API_KEY`를
 * 클라에 노출하지 않으려고 있는데 여기엔 감출 것이 없고, 호출부가 서버 컴포넌트라
 * 라우트 핸들러를 한 겹 두면 자기 자신에게 HTTP를 왕복하는 낭비만 남는다. 대신
 * `server-only`로 클라 유입을 빌드 타임에 막는다.
 */
export async function getOnlinePlayers(): Promise<OnlinePlayers | null> {
  // 캐시에서 온 값도 모양을 본다. 키에 판 번호를 붙여 두긴 했지만, 그것만 믿으면 옛 모양이
  // 하나라도 남아 있을 때 화면이 터진다 — 없는 필드를 그리려다 렌더가 통째로 죽는다.
  // 어긋난 값은 없는 셈 치고 다시 받아오면 그만이다.
  const cached = await readCachedValue<unknown>(CACHE_KEY);
  if (isOnlinePlayers(cached)) return cached;

  // 조금 전에 실패했으면 스팀을 또 두드리지 않는다.
  //
  // 실패 표시를 성공값과 같은 키에 담는 것이 요점이다. 키를 따로 두면 잘 되는 동안에도
  // 조회마다 GET이 한 번씩 더 나가 평상시 비용이 두 배가 된다. 여기 담으면 읽기는 한 번 그대로다.
  //
  // 이게 없으면 스팀이 죽어 있는 동안 모든 방문이 그대로 스팀으로 나간다. 게다가 화면의
  // "다시 시도"는 서버 렌더를 다시 받는 것이라, 사용자가 연타할 이유가 가장 큰 순간에
  // 방어가 가장 없어진다.
  if (isFailureMark(cached)) return null;

  const parsed = parseOnlinePlayers(await fetchJsonWithTimeout(CHARTS_URL, TIMEOUT));
  if (!parsed) {
    // 내가 실패하는 사이 다른 요청이 성공했을 수 있다. 그 값을 덮지 않고 그대로 쓴다.
    //
    // 실패 표시가 성공값과 같은 키에 앉으므로, 확인 없이 쓰면 늦게 실패한 요청이 먼저
    // 성공한 요청의 스냅샷을 지운다. 스팀이 멀쩡한데도 1분간 실패 화면이 뜨고, 화면의
    // "다시 시도"까지 죽는다 — 그 버튼도 이 표시를 읽고 곧장 돌아서기 때문이다.
    const fresh = await readCachedValue<unknown>(CACHE_KEY);
    if (isOnlinePlayers(fresh)) return fresh;

    await writeCachedValue(CACHE_KEY, { failedAt: Date.now() }, FAIL_TTL);
    return null;
  }

  // 이름 붙이기는 여기서 한 번만 한다. 캐시에 들어가면 그 뒤 5분은 GET 한 번으로 끝난다.
  //
  // 이름은 없어도 되는 값이라(표가 숫자로 대신 쓴다) 접속자 숫자를 붙잡게 두지 않는다.
  // 스토어가 굼뜬 날 이름 열 개를 기다리다 헤드라인까지 같이 늦어질 이유가 없다.
  const result = await withBudget(getAppNames(parsed.top.map((row) => row.appid)), NAME_BUDGET);
  const overBudget = result === OVER_BUDGET;
  const names = overBudget ? new Map<number, string>() : result;

  const named: OnlinePlayers = {
    ...parsed,
    top: parsed.top.map((row) => {
      const name = names.get(row.appid);
      return name ? { ...row, name } : row;
    }),
  };

  // 이름을 못 붙인 채로 5분을 굳히지 않는다. 스토어가 잠깐 굼떴을 뿐인데 그 대가로 표가
  // 5분 내내 숫자만 보여 줄 이유가 없다.
  //
  // "이름이 비었나"가 아니라 "예산을 넘겼나"로 가른다. 스토어 페이지가 내려간 게임은 이름이
  // 영영 안 잡히는데, 그걸 비었다고 보면 TTL이 영구히 1분으로 떨어져 스팀 호출이 다섯 배가 된다.
  await writeCachedValue(CACHE_KEY, named, overBudget ? FAIL_TTL : TTL);
  return named;
}

/** 예산을 넘겼다는 표시. 이름이 하나도 없는 것과는 다른 사건이라 값으로 구분한다. */
const OVER_BUDGET = Symbol("over-budget");

/**
 * 정해진 시간 안에 못 끝내면 기다리기를 그만둔다.
 *
 * 이긴 쪽이 누구든 타이머를 끈다. 안 끄면 평상시(캐시 히트라 수십 ms)에도 예산만큼 타이머가
 * 남아 아무도 안 기다리는 프라미스를 깨운다 — `fetchJson`에서 막은 것과 같은 새는 구멍이다.
 *
 * 진 쪽은 뒤에서 계속 돈다. 그쪽은 던지지 않고(내부가 전부 catch) 결과를 캐시에 남기므로,
 * 다음 갱신 때 이미 받아 둔 이름을 쓰게 된다.
 */
async function withBudget<T>(work: Promise<T>, ms: number): Promise<T | typeof OVER_BUDGET> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<typeof OVER_BUDGET>((resolve) => {
        timer = setTimeout(() => resolve(OVER_BUDGET), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
