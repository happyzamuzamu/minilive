import { useState, useEffect } from "react";
import useSWR from "swr";
import EventEditModal from "@/sections/EventEditModal";
import RoundEditModal from "@/sections/RoundEditModal";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminEventPage({ query }: any) {
  const eventId = query.id as string;
  const { data, mutate } = useSWR(`/api/admin/events/${eventId}/status`, fetcher, {
    refreshInterval: 5000,
  });

  const [showEventEdit, setShowEventEdit] = useState(false);
  const [showRoundEdit, setShowRoundEdit] = useState(false);
  const [adding, setAdding] = useState(false);
  const [guestNick, setGuestNick] = useState("");

  useEffect(() => {
    mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function addGuest() {
    if (!guestNick.trim()) return;
    setAdding(true);
    try {
      const r = await fetch(`/api/admin/events/${eventId}/add-guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: guestNick.trim() }),
      });
      if (r.ok) {
        setGuestNick("");
        mutate();
      } else {
        const t = await r.json().catch(() => ({}));
        alert(t?.error ?? "ADD_GUEST_FAILED");
      }
    } finally {
      setAdding(false);
    }
  }

  if (!data) return <div className="p-6">Loading...</div>;
  const ev = data.event;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ev.name}</h1>
          <p className="text-sm text-gray-500">ID: {ev.id}</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-2" onClick={() => setShowRoundEdit(true)}>
            라운드 설정
          </button>
          <button className="rounded bg-black px-3 py-2 text-white" onClick={() => setShowEventEdit(true)}>
            대회 설정
          </button>
        </div>
      </header>

      <section className="rounded border p-4">
        <h2 className="mb-3 font-semibold">게스트 추가</h2>
        <div className="flex gap-2">
          <input
            className="w-64 rounded border p-2"
            value={guestNick}
            onChange={(e) => setGuestNick(e.target.value)}
            placeholder="닉네임"
          />
          <button
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
            disabled={adding || !guestNick.trim()}
            onClick={addGuest}
          >
            추가
          </button>
        </div>
      </section>

      <section className="rounded border p-4">
        <h2 className="mb-3 font-semibold">스탠딩</h2>
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
              {(data.standings ?? []).map((r: any, i: number) => (
                <tr key={r.userId ?? i} className="border-t">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{r.nickname ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{r.wins ?? 0}</td>
                  <td className="px-3 py-2 text-right">{r.losses ?? 0}</td>
                  <td className="px-3 py-2 text-right">{r.points ?? 0}</td>
                  <td className="px-3 py-2 text-right">{Number(r?.sos ?? 0).toFixed(3)}</td>
                  <td className="px-3 py-2 text-right">{Number(r?.eos ?? 0).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showEventEdit && (
        <EventEditModal event={ev} onClose={() => setShowEventEdit(false)} onUpdated={() => mutate()} />
      )}

      {showRoundEdit && (
        <RoundEditModal event={ev} onClose={() => setShowRoundEdit(false)} onUpdated={() => mutate()} />
      )}
    </div>
  );
}

AdminEventPage.getInitialProps = ({ query }: any) => ({ query });