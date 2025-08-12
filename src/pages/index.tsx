import { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";
import { useState } from "react";
import OpponentDialog from "@/sections/OpponentDialog";
import TierPill from "@/sections/TierPill";

type Me = {
  id: string;
  nickname: string;
  games: number;
  wins: number;
  losses: number;
};

type RunningEvent = {
  id: string;
  name: string;
  date: string;
  format: string;
  rounds: number;
  bestOf: number;
};

type CurrentEvent = {
  id: string;
  name: string;
  date: string;
  format: string;
  rounds: number;
  bestOf: number;
  participants: number;
};

type Props = {
  me: Me | null;
  current: CurrentEvent | null;
  running: RunningEvent[];
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function Home({ me, current, running }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <main className="p-6 space-y-6">
      {current && (
        <section className="rounded-2xl border border-black/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: `"NeoDunggeunmo","Noto Sans KR",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif` }}>
                {current.name}
              </h1>
              <div className="text-sm text-gray-700">
                <span className="mr-3">날짜 {fmtDate(current.date)}</span>
                <span className="mr-3">참가자 {current.participants}명</span>
                <span className="mr-3">라운드 {current.rounds}</span>
                <span className="mr-3">방식 {current.format}</span>
                <span>Best of {current.bestOf}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-xl bg-black px-3 py-2 text-sm text-white">진행중</span>
              <button onClick={() => setOpen(true)} className="inline-flex items-center rounded-xl border border-black/20 bg-white px-4 py-2">
                상대 확인
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-black/10 p-4">
        <h2 className="mb-3 font-semibold">내 정보</h2>
        {me ? (
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div><span className="text-gray-500 mr-2">닉네임</span><span className="font-medium">{me.nickname}</span></div>
            <div><span className="text-gray-500 mr-2">전적</span><span className="font-medium">W{me.wins}–L{me.losses}</span></div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 mr-2">티어/포인트</span>
              <TierPill />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">사용자 정보를 불러올 수 없습니다.</p>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 p-4">
        <h2 className="mb-3 font-semibold">진행 중 대회</h2>
        {running.length === 0 ? (
          <p className="text-sm text-gray-600">현재 진행 중인 대회가 없습니다.</p>
        ) : (
          <ul className="grid gap-2">
            {running.map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2">
                <div className="space-y-0.5">
                  <div className="font-medium">{e.name}</div>
                  <div className="text-sm text-gray-700">
                    <span className="mr-3">{fmtDate(e.date)}</span>
                    <span className="mr-3">{e.format}</span>
                    <span>R{e.rounds}/Bo{e.bestOf}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {current && <OpponentDialog eventId={current.id} open={open} onClose={() => setOpen(false)} />}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const USER_ID = "demo-user";

  const meRow = await prisma.user.findUnique({
    where: { id: USER_ID },
    select: { id: true, nickname: true, games: true },
  });

  const entries = await prisma.entry.findMany({
    where: { userId: USER_ID },
    select: { wins: true, losses: true },
  });

  const wins = entries.reduce((a, b) => a + (b.wins || 0), 0);
  const losses = entries.reduce((a, b) => a + (b.losses || 0), 0);

  const me: Me | null = meRow
    ? {
        id: meRow.id,
        nickname: meRow.nickname,
        games: meRow.games,
        wins,
        losses,
      }
    : null;

  const currentEntry = await prisma.entry.findFirst({
    where: { userId: USER_ID, event: { state: "RUNNING" } },
    include: { event: { include: { entries: { select: { id: true } } } } },
    orderBy: { event: { date: "desc" } },
  });

  const current: CurrentEvent | null = currentEntry
    ? {
        id: currentEntry.event.id,
        name: currentEntry.event.name,
        date: currentEntry.event.date.toISOString(),
        format: currentEntry.event.format,
        rounds: currentEntry.event.rounds,
        bestOf: currentEntry.event.bestOf,
        participants: currentEntry.event.entries.length,
      }
    : null;

  const rows = await prisma.event.findMany({
    where: { state: "RUNNING" },
    orderBy: { date: "asc" },
    take: 12,
  });

  const running: RunningEvent[] = rows.map((e) => ({
    id: e.id,
    name: e.name,
    date: e.date.toISOString(),
    format: e.format,
    rounds: e.rounds,
    bestOf: e.bestOf,
  }));

  return { props: { me, current, running } };
};
