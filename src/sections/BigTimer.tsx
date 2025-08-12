"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function BigTimer({ eventId }: { eventId: string }) {
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

  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!isActive || !serverStartedAt) {
    return (
      <div className="w-full text-center text-5xl font-bold py-6" style={{ fontFamily: `"NeoDunggeunmo","Noto Sans KR",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif` }}>
        준비중
      </div>
    );
  }

  const elapsed = Math.max(0, Math.floor((now - serverStartedAt) / 1000));
  const remain = durationSec > 0 ? Math.max(0, durationSec - elapsed) : null;

  if (remain === 0 && durationSec > 0) {
    return (
      <div className="w-full text-center text-5xl font-bold py-6 text-red-600" style={{ fontFamily: `"NeoDunggeunmo","Noto Sans KR",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif` }}>
        시간 종료
      </div>
    );
  }

  const valueSec = remain ?? elapsed;
  const mm = String(Math.floor(valueSec / 60)).padStart(2, "0");
  const ss = String(valueSec % 60).padStart(2, "0");

  return (
    <div className="w-full text-center text-7xl font-bold py-6" style={{ fontFamily: `"NeoDunggeunmo","Noto Sans KR",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif` }}>
      {mm}:{ss}
    </div>
  );
}
