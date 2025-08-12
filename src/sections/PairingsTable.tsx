"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function useStatus(eventId: string) {
  const { data } = useSWR(`/api/admin/events/${eventId}/status`, fetcher, { refreshInterval: 3000 });
  const round = data?.round ?? {};
  const currentRoundNumber = round?.currentRoundNumber ?? null;
  return { currentRoundNumber };
}

export default function PairingsTable({ eventId }: { eventId: string }) {
  const { currentRoundNumber } = useStatus(eventId);
  const { data } = useSWR(`/api/events/${eventId}/matches`, fetcher, { refreshInterval: 3000 });

  const rows: any[] = Array.isArray(data) ? data : data?.matches ?? [];
  const filtered = rows.filter((m: any) => {
    if (currentRoundNumber == null) return true;
    if (m.roundNumber != null) return m.roundNumber === currentRoundNumber;
    if (m.round?.number != null) return m.round.number === currentRoundNumber;
    return !m.reported;
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[720px] w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2 text-left">테이블</th>
            <th className="px-3 py-2 text-left">P1</th>
            <th className="px-3 py-2 text-left">P2</th>
            <th className="px-3 py-2 text-left">결과</th>
            <th className="px-3 py-2 text-left">상태</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((m: any, i: number) => {
            const p1 = m.P1?.user?.nickname ?? m.P1?.nickname ?? m.p1?.nickname ?? m.p1Name ?? "-";
            const p2 = m.P2?.user?.nickname ?? m.P2?.nickname ?? m.p2?.nickname ?? m.p2Name ?? "-";
            const tableNo = m.tableNo ?? m.table ?? "-";
            const res = m.Winner?.user?.nickname ?? m.Winner?.nickname ?? (m.winnerId ? "완료" : "-");
            const status = m.reported ? "보고됨" : "진행중";
            return (
              <tr key={m.id ?? i} className="border-t">
                <td className="px-3 py-2">{tableNo}</td>
                <td className="px-3 py-2">{p1}</td>
                <td className="px-3 py-2">{p2}</td>
                <td className="px-3 py-2">{res}</td>
                <td className="px-3 py-2">{status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
