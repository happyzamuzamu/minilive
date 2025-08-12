import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type MatchRow = {
  id: number;
  tableNo: number | null;
  reported: boolean;
  winnerId: number | null;
  bestOf?: number | null;
  P1: { id: number; nickname: string } | null;
  P2: { id: number; nickname: string } | null;
};

export function AdminMatches({ eventId }: { eventId: string }) {
  const { data, isLoading, mutate } = useSWR<{ matches: MatchRow[] }>(`/api/admin/events/${eventId}/matches`, fetcher, { refreshInterval: 5000 });
  const [busyId, setBusyId] = useState<number | null>(null);

  const report = async (m: MatchRow, winner: "P1" | "P2" | "DRAW" | "UNREPORT") => {
    setBusyId(m.id);
    const winnerEntryId =
      winner === "UNREPORT" ? null : winner === "DRAW" ? null : winner === "P1" ? m.P1?.id ?? null : m.P2?.id ?? null;
    const reported = winner === "UNREPORT" ? false : true;
    await fetch(`/api/admin/events/${eventId}/matches/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: m.id, winnerEntryId, reported }),
    });
    setBusyId(null);
    mutate();
  };

  if (isLoading || !data) return <div className="rounded border p-4">Loading matches...</div>;

  return (
    <div className="rounded border">
      <div className="px-4 py-3 font-semibold">현재 페어링</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t">
              <th className="px-3 py-2 text-left">Table</th>
              <th className="px-3 py-2 text-left">Player 1</th>
              <th className="px-3 py-2 text-left">Player 2</th>
              <th className="px-3 py-2 text-left">Reported</th>
              <th className="px-3 py-2 text-left">Winner</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.matches.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-3 py-2">{m.tableNo ?? "-"}</td>
                <td className="px-3 py-2">{m.P1?.nickname ?? "-"}</td>
                <td className="px-3 py-2">{m.P2?.nickname ?? "-"}</td>
                <td className="px-3 py-2">{m.reported ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  {m.winnerId
                    ? m.winnerId === m.P1?.id
                      ? m.P1?.nickname
                      : m.P2?.nickname
                    : m.reported
                    ? "Draw"
                    : "-"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button disabled={busyId === m.id || !m.P1} onClick={() => report(m, "P1")} className="rounded bg-black/80 px-3 py-1 text-white disabled:opacity-50">
                      P1
                    </button>
                    <button disabled={busyId === m.id || !m.P2} onClick={() => report(m, "P2")} className="rounded bg-black/80 px-3 py-1 text-white disabled:opacity-50">
                      P2
                    </button>
                    <button disabled={busyId === m.id} onClick={() => report(m, "DRAW")} className="rounded bg-black/60 px-3 py-1 text-white disabled:opacity-50">
                      Draw
                    </button>
                    <button disabled={busyId === m.id} onClick={() => report(m, "UNREPORT")} className="rounded border px-3 py-1 disabled:opacity-50">
                      Clear
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data.matches.length === 0 && (
              <tr className="border-t">
                <td colSpan={6} className="px-3 py-8 text-center text-neutral-500">페어링이 없습니다</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}