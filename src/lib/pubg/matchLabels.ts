// PUBG 매치 응답의 내부 코드(맵·모드·매치 타입)를 화면용 한글 라벨로 바꾼다.
// 서버·클라이언트 양쪽에서 쓰므로 "server-only"를 붙이지 않는다.
import { GAME_MODES, type GameMode } from "@/lib/constants";

// PUBG가 맵 이름을 내부 코드명(예: Baltic_Main)으로 내려줘서 표시용 한글명으로 매핑한다.
export const MAP_NAME: Record<string, string> = {
  Baltic_Main: "에란겔",
  Erangel_Main: "에란겔",
  Desert_Main: "미라마",
  Savage_Main: "사녹",
  DihorOtok_Main: "비켄디",
  Kiki_Main: "데스턴",
  Tiger_Main: "태이고",
  Summerland_Main: "카라킨",
  Chimera_Main: "파라모",
  Heaven_Main: "해븐",
  Neon_Main: "론도",
  Range_Main: "훈련장",
};

// 모르는 코드는 "_Main" 꼬리만 떼고 그대로 보여준다(신규 맵 대응).
export function formatMapName(mapName: string): string {
  return MAP_NAME[mapName] ?? mapName.replace(/_Main$/, "");
}

export const GAME_MODE_LABEL: Record<GameMode, string> = {
  solo: "솔로",
  "solo-fpp": "솔로 1인칭",
  duo: "듀오",
  "duo-fpp": "듀오 1인칭",
  squad: "스쿼드",
  "squad-fpp": "스쿼드 1인칭",
};

// 아케이드(특수) 모드 라벨 — solo/duo/squad 외 gameMode. 미등록 특수모드는 '특별모드'로 표기한다.
const ARCADE_MODE_LABEL: Record<string, string> = {
  ibr: "인텐스 배틀로얄",
  tdm: "팀 데스매치",
};

// solo/duo/squad(+fpp) 표준 인원수 모드인지 — 아니면 아케이드(특수) 매치로 분류
export function isStandardMode(gameMode: string): gameMode is GameMode {
  return (GAME_MODES as readonly string[]).includes(gameMode);
}

const GAME_MODE_BASE: Record<string, string> = { solo: "솔로", duo: "듀오", squad: "스쿼드" };

// 시점 제외한 기본 모드 라벨 — '-fpp' 제거 후, 표준: 솔로/듀오/스쿼드, 아케이드: 등록 라벨 또는 '특별모드'
export function gameModeBaseLabel(gameMode: string): string {
  const base = gameMode.replace(/-fpp$/, "");
  return GAME_MODE_BASE[base] ?? ARCADE_MODE_LABEL[base] ?? "특별모드";
}

// 시점(퍼스펙티브) — '-fpp'면 1인칭(FPP), 아니면 3인칭(TPP)
export function gameModePerspective(gameMode: string): "1인칭" | "3인칭" {
  return /-fpp$/.test(gameMode) ? "1인칭" : "3인칭";
}

// 시점까지 반영한 전체 모드 라벨 — 표준 모드면 "스쿼드 1인칭", 아케이드면 기본 라벨
export function gameModeFullLabel(gameMode: string): string {
  return isStandardMode(gameMode) ? GAME_MODE_LABEL[gameMode] : gameModeBaseLabel(gameMode);
}

// 게임모드 라벨 앞에 붙일 구분 접두어 — "경쟁전 스쿼드", "캐주얼 솔로", "일반전 듀오" 형태
export function matchTypePrefix(matchType: string, gameMode: string): string {
  // 인원수(솔로/듀오/스쿼드) 축이 아닌 gameMode(ibr·tdm 등)는 아케이드(특수) 매치로 본다
  if (!isStandardMode(gameMode)) return "아케이드";
  if (matchType === "competitive") return "경쟁전";
  if (matchType === "airoyale") return "캐주얼";
  return "일반전";
}

// 전적으로 볼 실전 매치가 아닌 타입 — 훈련장/튜토리얼·커스텀은 최근 매치에서 숨긴다.
// (winPlace·rank가 0으로 와서 순위 배지가 깨지거나, 실전 전적으로 오인되기 때문)
const HIDDEN_MATCH_TYPES: ReadonlySet<string> = new Set(["training", "tutorialatoz", "custom"]);

export function isHiddenMatch(matchType: string, isCustomMatch: boolean): boolean {
  return isCustomMatch || HIDDEN_MATCH_TYPES.has(matchType);
}

export type PlacementVariant = "win" | "top10" | "default";

// 최종 순위(winPlace)로 배지 색상 분기 — 1등·Top10만 색을 준다
export function placementVariant(winPlace: number): PlacementVariant {
  if (winPlace === 1) return "win";
  if (winPlace <= 10) return "top10";
  return "default";
}

// 사망 유형(deathType) → 한글 라벨
export function deathLabel(type: string): string {
  switch (type) {
    case "alive":
      return "생존";
    case "byplayer":
      return "전사";
    case "byzone":
      return "자기장";
    case "suicide":
      return "자살";
    default:
      return type || "-";
  }
}

// 초 → "m:ss"
export function formatSurvival(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
