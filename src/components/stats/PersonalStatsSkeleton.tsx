// PersonalStats 스트리밍 대기용 스켈레톤.
//
// 실제 화면과 같은 뼈대를 그린다 — 구역 제목·칸 수·표 머리는 그대로 두고 값 자리만 비운다.
// 대충 회색 상자 하나를 띄우면 결과가 도착하는 순간 레이아웃이 크게 튄다(CLS).
//
// 구역과 칸 수는 손으로 적지 않고 `lifetimeFields.ts`에서 가져온다. 양쪽에 따로 적어 두면
// 한쪽만 고쳐 어긋나고, 그때 결과가 도착하는 순간 높이가 튄다.
import { LIFETIME_GROUPS, SURVIVAL_CELLS, WEAPON_COLUMNS } from "@/components/stats/lifetimeFields";

/** 표에 몇 줄을 그릴지. 실제 목록 길이는 사람마다 달라 공유할 수 없다. */
const WEAPON_ROWS = 12;

function Bar({ className = "" }: { className?: string }) {
  return <span className={`block h-3 animate-pulse rounded-sm bg-hairline ${className}`} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-secondary">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ cells }: { cells: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg border border-hairline bg-surface p-4 lg:grid-cols-4">
      {Array.from({ length: cells }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-2 py-1">
          <Bar className="w-16" />
          <Bar className="w-10" />
        </div>
      ))}
    </div>
  );
}

export default function PersonalStatsSkeleton() {
  return (
    // 스크린리더에는 "로딩 중"이라고 한 번만 알린다. 빈 상자 수십 개를 읽어 줄 이유가 없다.
    <div className="flex flex-col gap-8" role="status" aria-label="통계 불러오는 중">
      <Section title="통산 스탯">
        <div className="flex flex-wrap items-center gap-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <Bar key={index} className="h-7 w-20 rounded-sm" />
          ))}
        </div>
        {/* 실제 화면과 같은 구역 나눔. 한 덩어리로 그리면 결과가 올 때 제목 높이만큼 밀린다. */}
        <div className="flex flex-col gap-4">
          {LIFETIME_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
              <h3 className="text-caption font-semibold text-text-tertiary">{group.title}</h3>
              <Grid cells={group.fields.length} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="생존 마스터리">
        <Grid cells={SURVIVAL_CELLS} />
      </Section>

      <Section title="무기 숙련도 (XP 상위)">
        <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
          <table className="w-full min-w-[680px] text-caption">
            <tbody>
              {Array.from({ length: WEAPON_ROWS }).map((_, row) => (
                <tr key={row} className="border-b border-hairline last:border-0">
                  {Array.from({ length: WEAPON_COLUMNS.length }).map((_, col) => (
                    <td key={col} className="px-4 py-3">
                      <Bar className={col === 0 ? "w-20" : "ml-auto w-10"} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
