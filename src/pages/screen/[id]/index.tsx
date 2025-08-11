import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

type Status = {
  ok: boolean;
  event: { id: string; name: string; roundLengthSec?: number };
  roundNumber: number;
  roundStartedAt: number | null;
  roundEndsAt: number | null;
  durationSec: number;
  now: number;
};

export default function Screen() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [status, setStatus] = useState<Status | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const syncedOffset = useRef<number>(0);

  useEffect(() => {
    let alive = true;
    async function pull() {
      if (!id) return;
      const r = await fetch(`/api/screen/${id}/status`);
      if (!r.ok) return;
      const j = (await r.json()) as Status;
      if (!alive) return;
      setStatus(j);
      syncedOffset.current = j.now - Date.now();
    }
    pull();
    const p = setInterval(pull, 10000);
    return () => {
      alive = false;
      clearInterval(p);
    };
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const remainingMs = useMemo(() => {
    if (!status?.roundEndsAt) return null;
    const syncedNow = now + syncedOffset.current;
    return Math.max(0, status.roundEndsAt - syncedNow);
  }, [status?.roundEndsAt, now]);

  const mmss = useMemo(() => {
    if (remainingMs == null) return "--:--";
    const s = Math.floor(remainingMs / 1000);
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }, [remainingMs]);

  const title = status?.event?.name || "대회 대기중";
  const round = status?.roundNumber || 0;

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", width: "100vw", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 24 }}>
      <div style={{ fontSize: "3.5rem", fontWeight: 900, letterSpacing: 1 }}>{title}</div>
      <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
        <div style={{ fontSize: "2rem", opacity: 0.8 }}>현재 라운드</div>
        <div style={{ fontSize: "4rem", fontWeight: 900 }}>{round ? `${round}R` : "대기"}</div>
      </div>
      <div style={{ fontSize: "8rem", fontWeight: 900, lineHeight: 1, letterSpacing: 2 }}>
        {mmss}
      </div>
    </div>
  );
}