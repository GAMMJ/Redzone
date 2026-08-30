import type { GameRow } from "@/lib/steam/onlinePlayers";

/**
 * 접속자 많은 순 상위 게임 표.
 *
 * 이 값들은 PUBG를 꺼낸 그 응답에 이미 들어 있다 — 추가 호출이 없다. PUBG 줄을 강조해
 * 어디쯤인지 바로 보이게 한다.
 */
interface TopGamesProps {
  /** 이름까지 붙어 있는 줄들. 이름이 없는 줄은 숫자로 대신 쓴다. */
  rows: GameRow[];
  /** 강조할 줄 */
  highlightAppId: number;
}

export default function TopGames({ rows, highlightAppId }: TopGamesProps) {
  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-secondary">지금 사람 많은 게임</h2>

      {/* 좁은 화면에서 표가 페이지를 옆으로 밀지 않게 자기 안에서만 스크롤한다 */}
      <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
        <table className="w-full min-w-[420px] border-collapse">
          {/* 위 제목은 표와 프로그램적으로 묶여 있지 않다. 화면 낭독기의 표 목록에는
              이름 없이 뜨므로 여기서 이름을 준다. */}
          <caption className="sr-only">지금 사람 많은 게임 상위 {rows.length}개</caption>
          <thead>
            <tr className="border-b border-hairline">
              <th scope="col" className="w-16 whitespace-nowrap px-4 py-3 text-left text-caption font-medium text-text-tertiary">
                순위
              </th>
              <th scope="col" className="px-4 py-3 text-left text-caption font-medium text-text-tertiary">
                게임
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-caption font-medium text-text-tertiary">
                현재
              </th>
              {/* 스팀이 주는 최근 24시간 최고치. 지금이 붐비는 때인지 한산한 때인지를 준다. */}
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-caption font-medium text-text-tertiary">
                24시간 최고
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const mine = row.appid === highlightAppId;
              return (
                <tr
                  key={row.appid}
                  className={`border-b border-hairline last:border-b-0 ${mine ? "bg-primary-soft" : ""}`}
                >
                  <td className="px-4 py-2.5 font-mono text-caption text-text-tertiary">{row.rank}</td>
                  <td
                    className={`px-4 py-2.5 text-caption ${mine ? "font-bold text-text-primary" : "text-text-secondary"}`}
                  >
                    {/* 이름을 못 받았으면 숫자라도 보여 준다. 줄을 통째로 빼면 순위가 건너뛴다. */}
                    {row.name || `#${row.appid}`}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-mono text-caption ${mine ? "font-bold text-text-primary" : "text-text-primary"}`}
                  >
                    {row.count.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-caption text-text-tertiary">
                    {row.peak.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
