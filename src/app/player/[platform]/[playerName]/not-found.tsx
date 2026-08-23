"use client";

import { usePathname } from "next/navigation";
import { Home, SearchX } from "lucide-react";
import Container from "@/components/layout/Container";
import LinkButton from "@/components/ui/LinkButton";
import { PLATFORM_LABEL, isPlatform } from "@/lib/constants";

// not-found.tsx는 params를 받지 못해 경로에서 직접 읽는다: /player/{platform}/{name}
// 잘못된 플랫폼으로 들어온 경우(isValidShard 실패)도 이 화면이라 platform은 유효성 검사 후 쓴다.
function useSearchedPlayer() {
  const segments = usePathname().split("/");
  const rawPlatform = segments[2] ?? "";
  const rawName = segments[3] ?? "";

  // 표시 전용 값 — 잘못된 인코딩이면 원본 그대로 보여준다(입력한 내용을 알려주는 게 우선).
  let name = rawName;
  try {
    name = decodeURIComponent(rawName);
  } catch {
    // 디코딩 실패는 무시
  }

  return { platform: isPlatform(rawPlatform) ? rawPlatform : null, name };
}

// 확인 안내 — 실제로 가장 흔한 실패 원인 순서대로
const HINTS = [
  "닉네임의 대소문자가 정확한지 확인해 주세요. PUBG는 대소문자를 구분합니다.",
  "다른 플랫폼의 계정일 수 있습니다. Steam과 Kakao는 계정이 분리되어 있습니다.",
  "최근에 닉네임을 변경했다면 이전 닉네임으로는 조회되지 않습니다.",
];

export default function PlayerNotFound() {
  const { platform, name } = useSearchedPlayer();

  return (
    <Container className="flex flex-col items-center gap-8 py-20">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-surface-muted">
          <SearchX aria-hidden className="h-8 w-8 text-text-tertiary" />
        </span>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-text-primary">플레이어를 찾을 수 없습니다</h1>
          {name && (
            <p className="text-caption text-text-secondary">
              {platform && (
                <span className="font-medium text-text-primary">{PLATFORM_LABEL[platform]}</span>
              )}
              {platform && " · "}
              <span className="font-medium text-text-primary">{name}</span>
              <span> 에 해당하는 전적이 없습니다</span>
            </p>
          )}
        </div>
      </div>

      <ul className="flex w-full max-w-[520px] flex-col gap-2 rounded-lg border border-hairline bg-surface p-5">
        {HINTS.map((hint) => (
          <li key={hint} className="flex gap-2 text-caption text-text-secondary">
            <span aria-hidden className="text-text-tertiary">
              •
            </span>
            {hint}
          </li>
        ))}
      </ul>

      <LinkButton
        href="/"
        icon={Home}
        iconPosition="left"
        className="gap-1.5 transition-opacity hover:opacity-80"
      >
        홈으로 돌아가기
      </LinkButton>
    </Container>
  );
}
