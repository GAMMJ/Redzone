// 지도 이미지와 좌표 변환.
//
// 이미지는 PUBG 공식 저장소(pubg/api-assets)의 No_Text 판을 819px webp로 줄여 public/maps/ 에 뒀다.
// 준비 스크립트는 docs/local/scratch/build-map-assets.mjs 다.

/** public/maps/ 이미지 한 변 길이(px). 좌표 변환 기준이다. */
export const MAP_IMAGE_SIZE = 819;

interface MapAsset {
  /** public/maps/ 아래 파일 이름(확장자 제외) */
  slug: string;
  /**
   * 맵 한 변의 실제 크기(텔레메트리 단위, 1 = 1cm).
   *
   * 좌표를 이 값으로 나눠 0~1 비율을 만든 뒤 이미지 픽셀에 얹는다.
   * 실측으로 검증했다 — 에란겔 킬 좌표 최대 547,767, 태이고 705,326으로 모두 규격 안에 들어온다.
   * (전체 위치 이벤트는 비행기가 맵 밖을 날아 경계를 넘으므로 크기 추정에 쓸 수 없다)
   */
  worldSize: number;
}

// PUBG가 주는 맵 코드는 에셋 파일명과 다른 것이 있다.
//   Baltic_Main(리마스터 에란겔) → erangel
//   Range_Main(훈련장)          → camp-jackal
// 자동 변환을 믿으면 가장 흔한 에란겔부터 지도가 안 뜬다.
const MAP_ASSETS: Record<string, MapAsset> = {
  Baltic_Main: { slug: "erangel", worldSize: 816000 },
  Erangel_Main: { slug: "erangel", worldSize: 816000 },
  Desert_Main: { slug: "miramar", worldSize: 816000 },
  Tiger_Main: { slug: "taego", worldSize: 816000 },
  Kiki_Main: { slug: "deston", worldSize: 816000 },
  Neon_Main: { slug: "rondo", worldSize: 816000 },
  DihorOtok_Main: { slug: "vikendi", worldSize: 612000 },
  Savage_Main: { slug: "sanhok", worldSize: 408000 },
  Chimera_Main: { slug: "paramo", worldSize: 306000 },
  Summerland_Main: { slug: "karakin", worldSize: 204000 },
  Range_Main: { slug: "camp-jackal", worldSize: 204000 },
  Heaven_Main: { slug: "haven", worldSize: 102000 },
};

export function mapAssetOf(mapName: string): MapAsset | null {
  return MAP_ASSETS[mapName] ?? null;
}

export function mapImageUrl(asset: MapAsset): string {
  return `/maps/${asset.slug}.webp`;
}

/**
 * 확대용 상세 이미지(3072px, 약 1MB).
 *
 * 개요(819px)로는 4배만 넘어가도 뭉갠다. 대신 확대하지 않는 사용자에게 1MB를 물릴 이유가 없어
 * 파일을 나눠 두고 처음 확대할 때만 받는다.
 */
export function mapDetailUrl(asset: MapAsset): string {
  return `/maps/${asset.slug}-detail.webp`;
}

/**
 * 텔레메트리 좌표(미터) → 이미지 위 백분율.
 *
 * 요약이 이미 미터로 줄여 뒀으므로 worldSize도 미터로 환산해 나눈다.
 * 경계를 벗어난 값은 잘라낸다 — 비행 중 좌표나 이상값이 지도 밖으로 튀지 않게 한다.
 */
export function toMapPercent(
  point: { x: number; y: number },
  asset: MapAsset,
): { left: number; top: number } {
  const sizeInMeters = asset.worldSize / 100;
  const clamp = (v: number) => Math.min(100, Math.max(0, (v / sizeInMeters) * 100));
  return { left: clamp(point.x), top: clamp(point.y) };
}
