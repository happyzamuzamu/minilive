// src/pages/leaderboard.tsx
import { useEffect, useState } from "react";
import Image from "next/image";
import { tierFromRating, computeHyperTop5Cut, formatPP } from "@/lib/season-elo";
import { ballIconPath } from "@/lib/pp-icon";

type Row = { id: string; nickname: string; rating: number; games: number; tier: string; icon: string };

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/leaderboard/top20").then(res => res.json());
      setRows(r.rows || []);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white p-4">
      <h1 className="text-xl font-bold mb-4">랭킹 Top 20</h1>
      <div className="grid gap-2">
        {rows.map((u, i) => (
          <div key={u.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <div className="flex items-center gap-3">
              <div className="w-6 text-white/70">{i + 1}</div>
              <Image src={u.icon} alt={u.tier} width={20} height={20} />
              <div className="font-semibold">{u.nickname}</div>
            </div>
            <div className="text-sm text-white/80">{formatPP(u.rating)} · {u.tier} · {u.games}경기</div>
          </div>
        ))}
      </div>
    </div>
  );
}