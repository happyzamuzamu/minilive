"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StandingsTable({ eventId }: { eventId: string }) {
  const { data } = useSWR(`/api/events/${eventId}/standings`, fetcher, { refreshInterval: 3000 });
  const rows = Array.isArray(data) ? data : data?.standings ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[720px] w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">닉네임</th>
            <th className="px-3 py-2 text-right">W</th>
            <th className="px-3 py-2 text-right">L</th>
            <th className="px-3 py-2 text-right">PTS</th>
            <th className="px-3 py-2 text-right">SOS</th>
            <th className="px-3 py-2 text-right">EOS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any, i: number) => (
            <tr key={r.userId ?? r.id ?? i} className="border-t">
              <td className="px-3 py-2">{i + 1}</td>
              <td className="px-3 py-2">{r.nickname ?? "-"}</td>
              <td className="px-3 py-2 text-right">{r.wins ?? r.W ?? 0}</td>
              <td className="px-3 py-2 text-right">{r.losses ?? r.L ?? 0}</td>
              <td className="px-3 py-2 text-right">{r.points ?? r.PTS ?? 0}</td>
              <td className="px-3 py-2 text-right">{Number(r?.sos ?? r?.SOS ?? 0).toFixed(3)}</td>
              <td className="px-3 py-2 text-right">{Number(r?.eos ?? r?.EOS ?? 0).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
