import { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";

type Me = {
  id: string;
  nickname: string;
  rating: number;
  games: number;
};

type Recent = {
  id: number;
  event: {
    id: string;
    name: string;
    date: string;
    format: string;
  };
  wins: number;
  losses: number;
  eloDelta: number;
};

type Props = {
  me: Me | null;
  recent: Recent[];
};

const fmt = (iso: string) => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function ProfilePage({ me, recent }: Props) {
  return (
    <main className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: `"NeoDunggeunmo","Noto Sans KR",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif` }}>
          내 프로필
        </h1>
      </header>

      <section className="rounded-2xl border border-black/10 p-4">
        {me ? (
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div><span className="text-gray-500 mr-2">닉네임</span><span className="font-medium">{me.nickname}</span></div>
            <div><span className="text-gray-500 mr-2">레이팅</span><span className="font-medium">{me.rating}</span></div>
            <div><span className="text-gray-500 mr-2">경기 수</span><span className="font-medium">{me.games}</span></div>
            <div><span className="text-gray-500 mr-2">ID</span><span className="font-medium">{me.id}</span></div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">사용자 정보를 불러올 수 없습니다.</p>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 p-4">
        <h2 className="mb-3 font-semibold">최근 참가 대회</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-600">최근 참가 내역이 없습니다.</p>
        ) : (
          <ul className="grid gap-2">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2">
                <div className="space-y-0.5">
                  <div className="font-medium">{r.event.name}</div>
                  <div className="text-sm text-gray-700">
                    <span className="mr-3">{fmt(r.event.date)}</span>
                    <span className="mr-3">{r.event.format}</span>
                    <span>W{r.wins}–L{r.losses}</span>
                    <span className="ml-3">{r.eloDelta >= 0 ? `+${r.eloDelta}` : r.eloDelta}</span>
                  </div>
                </div>
                <a href={`/events/${r.event.id}`} className="rounded-xl border border-black/20 px-4 py-2">상세</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const USER_ID = "demo-user";
  const meRow = await prisma.user.findUnique({
    where: { id: USER_ID },
    select: { id: true, nickname: true, rating: true, games: true },
  });

  const recentRows = await prisma.entry.findMany({
    where: { userId: USER_ID },
    include: { event: true },
    orderBy: { event: { date: "desc" } },
    take: 12,
  });

  const me = meRow ? { id: meRow.id, nickname: meRow.nickname, rating: meRow.rating, games: meRow.games } : null;

  const recent: Recent[] = recentRows.map((e) => ({
    id: e.id,
    event: {
      id: e.event.id,
      name: e.event.name,
      date: e.event.date.toISOString(),
      format: e.event.format,
    },
    wins: e.wins,
    losses: e.losses,
    eloDelta: e.eloDelta,
  }));

  return { props: { me, recent } };
};
