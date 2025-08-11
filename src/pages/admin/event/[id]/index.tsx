import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type Status = {
  event: {
    id: string;
    name: string;
    date: string;
    state: string;
    rounds: number;
    bestOf: number;
    format: string;
    roundLengthSec: number | null;
  };
  currentRound: number;
  totalRounds: number;
  reportedInCurrentRound: number;
  totalMatchesInCurrentRound: number;
  remainingSec: number | null;
};

export default function AdminEventDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchStatus() {
    if (!id || typeof id !== "string") return;
    const r = await fetch(`/api/admin/events/${id}/status`);
    if (!r.ok) return;
    const data = await r.json();
    setStatus(data);
  }

  async function startRound() {
    if (!id || typeof id !== "string") return;
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/events/${id}/round/start`, { method: "POST" });
      if (r.ok) await fetchStatus();
    } finally {
      setLoading(false);
    }
  }

  async function autoTables() {
    if (!id || typeof id !== "string") return;
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/events/${id}/tables`, { method: "POST" });
      if (r.ok) await fetchStatus();
    } finally {
      setLoading(false);
    }
  }

  async function makePlayoffs() {
    if (!id || typeof id !== "string") return;
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/events/${id}/playoffs`, { method: "POST" });
      if (r.ok) await fetchStatus();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 5000);
    return () => clearInterval(t);
  }, [id]);

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>관리자 · 대회 상세</h1>

      <div style={{ display: "grid", gap: 8, padding: 12, border: "1px solid #222", borderRadius: 8 }}>
        <div style={{ fontWeight: 700 }}>
          {status ? `${status.event.name} · ${status.event.date.slice(0,10)}` : "불러오는 중"}
        </div>
        <div>상태: {status?.event.state ?? "-"}</div>
        <div>라운드: {status ? `${status.currentRound}/${status.totalRounds}` : "-"}</div>
        <div>이번 라운드 보고: {status ? `${status.reportedInCurrentRound}/${status.totalMatchesInCurrentRound}` : "-"}</div>
        <div>남은 시간: {status?.remainingSec != null ? `${Math.max(0, status.remainingSec)}s` : "-"}</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button disabled={loading} onClick={startRound} style={btn}>라운드 시작</button>
        <button disabled={loading} onClick={autoTables} style={btn}>테이블 자동배정</button>
        <button disabled={loading} onClick={makePlayoffs} style={btn}>토너먼트 생성</button>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};