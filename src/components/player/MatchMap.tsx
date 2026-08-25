"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import {
  MAP_IMAGE_SIZE,
  mapAssetOf,
  mapDetailUrl,
  mapImageUrl,
  toMapPercent,
} from "@/lib/pubg/mapAssets";
import type { TelemetryPoint } from "@/types/telemetry";

/**
 * 확대 단계.
 *
 * 상세 이미지가 3072px이고 지도 박스가 약 420px이라 8배까지는 또렷하다.
 * 그보다 키우면 원본을 늘리는 셈이라 뭉갠다.
 */
const ZOOM_LEVELS = [1, 2, 4, 6, 8];

/**
 * 마커를 고르면 바로 이 단계로 간다.
 *
 * 핫드랍 지점은 킬이 같은 자리에 몰려 마커가 서로를 가린다.
 * 이 배율이면 건물이 구분되고 뭉친 마커도 벌어진다.
 */
const FOCUS_ZOOM = 6;

/**
 * 고른 지점을 지도 한가운데로 끌어오는 평행이동량(지도 한 변 대비 비율).
 *
 * 원점만 그 점에 두면 배율만 커질 뿐 점은 "있던 자리"에 그대로 남는다.
 * 맵 구석에서 난 킬은 확대해도 구석에 붙어 있어 주변이 안 보인다.
 * 그래서 원점을 그 점에 둔 채로 화면 중앙까지 밀어 준다.
 *
 * 다만 끝까지 밀면 지도 바깥 여백이 드러난다. 지도의 양 끝이 상자 안으로
 * 들어오지 않는 선까지만 밀어서, 구석 킬은 중앙 대신 갈 수 있는 만큼만 간다.
 */
function panFraction(focus: number, zoom: number): number {
  // 확대 후 지도 왼쪽(위) 끝이 놓일 자리. 0이면 상자와 딱 맞고, 양수면 여백이 생긴다.
  const ideal = 0.5 - zoom * focus;
  const clamped = Math.min(0, Math.max(1 - zoom, ideal));
  return clamped - focus * (1 - zoom);
}

export interface MapMarker {
  id: string;
  /** 타임라인에서 매긴 순번. 마커 안에 그대로 찍는다. */
  order: number;
  at: TelemetryPoint;
  /** 내가 낸 킬인지 — 색을 가른다 */
  mine: boolean;
}

interface MatchMapProps {
  mapName: string;
  markers: MapMarker[];
  /** 타임라인에서 가리키고 있는 항목. 그 지점으로 확대한다. */
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function MatchMap({ mapName, markers, activeId, onSelect }: MatchMapProps) {
  const asset = mapAssetOf(mapName);
  const [zoom, setZoom] = useState(1);
  const [detailLoaded, setDetailLoaded] = useState(false);

  const focused = markers.find((m) => m.id === activeId) ?? null;
  const focusedId = focused?.id ?? null;

  // 마커를 고르면 바로 들어가고, 선택을 풀면 전체로 돌아간다.
  //
  // effect로 맞추면 한 번 그린 뒤 다시 그리게 되고, 린트도 막는다.
  // 선택이 바뀐 것을 렌더 중에 알아채고 그 자리에서 배율을 조정한다.
  // 조정 후에는 사용자가 +/-로 자유롭게 바꿀 수 있다.
  const [syncedFocusId, setSyncedFocusId] = useState<string | null>(null);
  if (focusedId !== syncedFocusId) {
    setSyncedFocusId(focusedId);
    setZoom(focusedId ? FOCUS_ZOOM : 1);
  }

  // 새 맵이 나오면 이미지가 없을 수 있다. 그때는 지도 자리를 비우고 타임라인만 쓴다.
  if (!asset) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border border-hairline bg-surface-subtle">
        <p className="text-caption text-text-tertiary">이 맵의 지도 이미지가 없습니다</p>
      </div>
    );
  }

  const focusAt = focused ? toMapPercent(focused.at, asset) : null;
  const origin = focusAt ? `${focusAt.left}% ${focusAt.top}%` : "center";
  const zoomIndex = ZOOM_LEVELS.indexOf(zoom);

  // translate가 scale보다 앞에 와야 배율과 무관하게 같은 양만큼 밀린다.
  const pan = focusAt
    ? `translate(${panFraction(focusAt.left / 100, zoom) * 100}%, ${
        panFraction(focusAt.top / 100, zoom) * 100
      }%) `
    : "";

  function step(delta: number) {
    const next = ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, Math.max(0, zoomIndex + delta))];
    setZoom(next ?? 1);
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border border-hairline">
      {/*
        transform-origin을 고른 지점에 두고 키운 뒤, 그 점을 상자 한가운데로 민다.
        원점 덕분에 배율을 올려도 그 점이 흔들리지 않고, 평행이동 덕분에 구석 킬도 가운데로 온다.
        배율·원점·이동량이 모두 데이터에서 오므로 클래스가 아니라 style로 준다(StatBar와 같은 이유).
      */}
      <div
        style={{ transform: `${pan}scale(${zoom})`, transformOrigin: origin }}
        className="h-full w-full transition-transform duration-300 ease-out"
      >
        {/* next/image 금지(CLAUDE.md) — 사전 압축한 webp를 크기 지정해 넣어 CLS를 막는다 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mapImageUrl(asset)}
          alt=""
          width={MAP_IMAGE_SIZE}
          height={MAP_IMAGE_SIZE}
          className="h-full w-full object-cover"
        />

        {/*
          상세 이미지(3072px)는 약 1MB라 확대하지 않는 사용자에게 물리지 않는다.
          처음 확대할 때 받아 개요 위에 덮고, 받기 전까지는 개요가 그대로 보인다.
        */}
        {zoom > 1 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mapDetailUrl(asset)}
            alt=""
            onLoad={() => setDetailLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
              detailLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {markers.map((marker) => {
          const { left, top } = toMapPercent(marker.at, asset);
          const active = marker.id === activeId;
          return (
            <button
              key={marker.id}
              type="button"
              onClick={() => onSelect(marker.id)}
              aria-label={`${marker.order}번째 킬 위치`}
              // 좌표와 역배율은 데이터에서 오므로 Tailwind 클래스로 만들 수 없다.
              // StatBar가 너비를 같은 방식으로 주고 있어 그 선례를 따른다.
              //
              // 지도가 커질 때 마커까지 같이 커지면 화면을 다 덮는다.
              // 배율의 역수를 걸어 마커는 원래 크기를 유지한다.
              style={{
                left: `${left}%`,
                top: `${top}%`,
                transform: `translate(-50%, -50%) scale(${1 / zoom})`,
              }}
              className={`absolute flex items-center justify-center rounded-pill border-2 border-surface text-[10px] font-bold transition-[width,height,background-color] ${
                active
                  ? "z-10 h-7 w-7 bg-primary text-primary-foreground"
                  : marker.mine
                    ? "h-5 w-5 bg-primary text-primary-foreground hover:h-6 hover:w-6"
                    : "h-5 w-5 bg-text-tertiary text-surface hover:h-6 hover:w-6"
              }`}
            >
              {marker.order}
            </button>
          );
        })}
      </div>

      {/* 확대 컨트롤 — 마커를 고르지 않고도 지도를 들여다볼 수 있어야 한다 */}
      <div className="absolute left-2 top-2 flex flex-col overflow-hidden rounded-sm border border-hairline bg-surface/90 shadow-sm">
        <ZoomButton
          label="확대"
          disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
          onClick={() => step(1)}
        >
          <Plus aria-hidden className="h-4 w-4" />
        </ZoomButton>
        <span aria-hidden className="h-px bg-hairline" />
        <ZoomButton label="축소" disabled={zoomIndex <= 0} onClick={() => step(-1)}>
          <Minus aria-hidden className="h-4 w-4" />
        </ZoomButton>
      </div>

      {zoom > 1 && (
        <span className="absolute bottom-2 left-2 rounded-sm bg-surface/90 px-2 py-1 text-[11px] font-semibold text-text-secondary shadow-sm">
          {zoom}배
        </span>
      )}

      {/* 확대 중일 때만 나오는 되돌리기. 선택도 함께 푼다. */}
      {focused && (
        <button
          type="button"
          onClick={() => onSelect(focused.id)}
          className="absolute right-2 top-2 rounded-sm bg-surface/90 px-2.5 py-1.5 text-[11px] font-semibold text-text-secondary shadow-sm transition-colors hover:text-text-primary"
        >
          전체 보기
        </button>
      )}
    </div>
  );
}

function ZoomButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center text-text-secondary transition-colors hover:text-text-primary disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
