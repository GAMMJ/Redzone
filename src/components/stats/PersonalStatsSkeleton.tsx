// PersonalStats 스트리밍 대기용 스켈레톤.
//
// 실제 화면과 같은 뼈대를 그린다 — 구역 제목·칸 수·표 머리는 그대로 두고 값 자리만 비운다.
// 대충 회색 상자 하나를 띄우면 결과가 도착하는 순간 레이아웃이 크게 튄다(CLS).
//
// 칸 수는 PersonalStats와 맞춰 둔 값이다. 그쪽이 바뀌면 여기도 따라와야 하지만, 어긋나도
// 잠깐 높이가 튈 뿐 화면이 깨지지는 않는다.

const LIFETIME_CELLS = 26;
const SURVIVAL_CELLS = 4;
const WEAPON_ROWS = 12;
const WEAPON_COLUMNS = 9;

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
        <Grid cells={LIFETIME_CELLS} />
      </Section>

      <Section title="생존 마스터리">
        <Grid cells={SURVIVAL_CELLS} />
      </Section>

      <Section title="무기 숙련도 (XP 상위)">
        <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
          <table className="w-full min-w-[760px] text-caption">
            <tbody>
              {Array.from({ length: WEAPON_ROWS }).map((_, row) => (
                <tr key={row} className="border-b border-hairline last:border-0">
                  {Array.from({ length: WEAPON_COLUMNS }).map((_, col) => (
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
