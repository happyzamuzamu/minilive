import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import EventEditModal from "@/sections/EventEditModal";
import RoundEditModal from "@/sections/RoundEditModal";
import TimerBadge from "@/sections/TimerBadge";
import StandingsTable from "@/sections/StandingsTable";
import PairingsTable from "@/sections/PairingsTable";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const fmtDate = (d: string | Date) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function AdminEventPage({ query }: any) {
  const eventId = query.id as string;
  const { data, mutate } = useSWR(`/api/admin/events/${eventId}/status`, fetcher, { refreshInterval: 3000 });
  const [showEventEdit, setShowEventEdit] = useState(false);
  const [showRoundEdit, setShowRoundEdit] = useState(false);

  useEffect(() => {
    mutate();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return <div className="p-6">Loading...</div>;
  const ev = data.event;
  const round = data.round;
  const isActive = Boolean(round?.isActive);
  const allReported = Boolean(round?.allReported);

  return (
    <div className="p-6 space-y-6">
      <section className="rounded-2xl border border-black/10 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: `"NeoDunggeunmo","Noto Sans KR",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif` }}>
              {ev.name}
            </h1>
            <div className="text-sm text-gray-700">
              <span className="mr-3">날짜 {fmtDate(ev.date)}</span>
              <span className="mr-3">참가자 {ev.participants}명</span>
              <span className="mr-3">라운드 {round?.currentRoundNumber ?? 0}/{ev.rounds}</span>
              <span className="mr-3">방식 {ev.format}</span>
              <span>Best of {ev.bestOf}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isActive && (
              <Link href={`/admin/event/${eventId}/round/start`} className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-white shadow-sm outline-none ring-offset-2 focus:ring-2 focus:ring-black">
                라운드 시작
              </Link>
            )}
            {isActive && allReported && (
              <Link href={`/admin/event/${eventId}/round/end`} className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-white shadow-sm outline-none ring-offset-2 focus:ring-2 focus:ring-red-600">
                라운드 종료
              </Link>
            )}
            <TimerBadge eventId={eventId} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 p-4">
        <div className="flex gap-2">
          <button className="inline-flex items-center rounded-xl border border-black/20 bg-white px-4 py-2 text-black outline-none ring-offset-2 focus:ring-2 focus:ring-black" onClick={() => setShowRoundEdit(true)}>
            라운드 설정
          </button>
          <button className="inline-flex items-center rounded-xl border border-black/20 bg-white px-4 py-2 text-black outline-none ring-offset-2 focus:ring-2 focus:ring-black" onClick={() => setShowEventEdit(true)}>
            대회 설정
          </button>
          <Link href={`/screen/${eventId}/qr`} className="inline-flex items-center rounded-xl border border-black/20 bg-white px-4 py-2 text-black outline-none ring-offset-2 focus:ring-2 focus:ring-black">
            체크인 페이지
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 p-4">
        <h2 className="mb-3 font-semibold">스탠딩</h2>
        <StandingsTable eventId={eventId} />
      </section>

      <section className="rounded-2xl border border-black/10 p-4">
        <h2 className="mb-3 font-semibold">대진표</h2>
        <PairingsTable eventId={eventId} />
      </section>

      {showEventEdit && <EventEditModal event={ev} onClose={() => setShowEventEdit(false)} onUpdated={() => mutate()} />}
      {showRoundEdit && <RoundEditModal event={ev} onClose={() => setShowRoundEdit(false)} onUpdated={() => mutate()} />}
    </div>
  );
}

AdminEventPage.getInitialProps = ({ query }: any) => ({ query });
