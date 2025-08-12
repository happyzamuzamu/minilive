"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TimerBadge({ eventId }: { eventId: string }) {
  const { data } = useSWR(`/api/admin/events/${eventId}/status`, fetcher, { refreshInterval: 3000 });
  const round = data?.round ?? {};
  const isActive = Boolean(round?.isActive);
  const startedRaw = round?.roundStartedAt ?? null;
  const durationSec = Number(round?.roundDurationSec ?? 0) || 0;

  const serverStartedAt = useMemo(() => {
    if (!startedRaw) return null;
    const t = Date.parse(startedRaw);
    return Number.isFinite(t) ? t : null;
  }, [startedRaw]);

  const localKey = `roundTimer:${eventId}`;
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    if (serverStartedAt) {
      setStartedAt(serverStartedAt);
      localStorage.setItem(localKey, String(serverStartedAt));
      return;
    }
    if (!isActive) {
      localStorage.removeItem(localKey);
      setStartedAt(null);
      return;
    }
    const saved = Number(localStorage.getItem(localKey) || "");
    if (saved && Number.isFinite(saved)) setStartedAt(saved);
  }, [serverStartedAt, isActive, localKey]);

  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!isActive || !startedAt) {
    return (
      <span className="inline-flex items-center rounded-xl border border-black/20 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        준비중
      </span>
    );
  }

  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const remain = durationSec > 0 ? Math.max(0, durationSec - elapsed) : null;

  if (remain === 0 && durationSec > 0) {
    return (
      <span className="inline-flex items-center rounded-xl bg-red-600 px-3 py-2 text-sm text-white">
        시간 종료
      </span>
    );
  }

  const valueSec = remain ?? elapsed;
  const mm = String(Math.floor(valueSec / 60)).padStart(2, "0");
  const ss = String(valueSec % 60).padStart(2, "0");

  return (
    <span className="inline-flex items-center rounded-xl border border-black/20 px-3 py-2 text-sm">
      ⏱ {mm}:{ss}
    </span>
  );
}
