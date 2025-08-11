import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { prisma } from "@/lib/prisma";
import { ratingToBall, ballIconPath, computeTop5Cutoff } from "@/utils/tier";
import { formatPP } from "@/lib/elo";

type Recent = { date: string; name: string; wins: number; losses: number; eloDelta: number };
type Current = { name: string; roundText: string; wl: string };
type UserView = { nickname: string; rating: number; ppText: string; ball: string; icon: string; games: number };

export async function getServerSideProps() {
  const USER_ID = "demo-user";

  // 1) 유저
  const userRow = await prisma.user.findUnique({ where: { id: USER_ID } });

  // 2) 최근 종료된 대회 (ENDED만)
  const endedEntries = await prisma.entry.findMany({
    where: { userId: USER_ID, Event: { state: "ENDED" } },
    include: { Event: true },
    orderBy: { Event: { date: "desc" } },
    take: 8,
  });

  // 3) 참여 중 대회 (ENDED 제외)
  const currentEntry = await prisma.entry.findFirst({
    where: { userId: USER_ID, NOT: { Event: { state: "ENDED" } } },
    include: { Event: true },
    orderBy: { Event: { date: "desc" } },
  });

  // 4) 상위 5명 컷(마스터볼용)
  const topUsers = await prisma.user.findMany({
    orderBy: { rating: "desc" },
    take: 5,
    select: { rating: true },
  });
  const ratingsDesc = topUsers.map(u => u.rating).sort((a, b) => b - a);
  const top5Cutoff = computeTop5Cutoff(ratingsDesc);

  // 가공
  const user: UserView | null = userRow
    ? (() => {
        const ball = ratingToBall(userRow.rating, top5Cutoff);
        const icon = ballIconPath(ball);
        return {
          nickname: userRow.nickname,
          rating: userRow.rating,
          ppText: formatPP(userRow.rating),
          ball,
          icon,
          games: userRow.games,
        };
      })()
    : null;

  const current: Current | null = currentEntry
    ? {
        name: currentEntry.Event!.name,
        roundText: `Round ${Math.max(1, (currentEntry as any).round ?? 1)} / ${currentEntry.Event!.rounds}`,
        wl: `${currentEntry.wins}승 ${currentEntry.losses}패`,
      }
    : null;

  const recent: Recent[] = endedEntries.map(({ Event: ev, wins, losses, eloDelta }) => ({
    date: ev!.date.toISOString().slice(0, 10),
    name: ev!.name,
    wins,
    losses,
    eloDelta,
  }));

  return { props: { user, current, recent } };
}

export default function Home({
  user,
  current,
  recent,
}: {
  user: UserView | null;
  current: Current | null;
  recent: Recent[];
}) {
  const [openTable, setOpenTable] = useState(false);
  const [openReport, setOpenReport] = useState(false);

  return (
    <>
      <Head>
        <title>MiniLive | 내 전적</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-2 font-bold">
            <span className="text-orange-500">미니</span>
            <span className="text-white">라이브</span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-neutral-300">
            <a href="/" className="hover:text-white">내 정보</a>
            <a href="/leaderboard" className="hover:text-white">랭킹</a>
            <a href="/notice" className="hover:text-white">공지</a>
          </nav>
        </div>
      </header>

      {/* 참여 중 대회 레이어 */}
      {current && (
        <section className="z-20 border-b border-neutral-800 bg-black">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <div className="text-sm text-neutral-200">
              <div className="font-semibold text-white">{current.name}</div>
              <div className="opacity-80">{current.roundText} · {current.wl}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOpenTable(true)}
                className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-900 active:scale-[0.98]"
              >
                테이블 확인
              </button>
              <button
                onClick={() => setOpenReport(true)}
                className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-black hover:bg-orange-400 active:scale-[0.98]"
              >
                승패 입력
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main */}
      <main className="mx-auto max-w-3xl px-4 py-6 bg-black min-h-screen text-white">
        <h1 className="mb-4 text-xl font-bold">내 전적</h1>

        {/* 프로필 카드 */}
        <section className="mb-6 rounded-2xl border border-neutral-800 p-4">
          {user ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold">{user.nickname}</div>
                <div className="mt-1 text-sm text-neutral-300">
                  경기수 <span className="font-semibold text-white">{user.games}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Image src={user.icon} alt={user.ball} width={28} height={28} />
                <div className="text-sm">
                  <div className="font-semibold">{user.ppText}</div>
                  <div className="text-neutral-400">{user.ball}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-400">로그인이 필요합니다.</div>
          )}
        </section>

        {/* 최근 대회 기록 */}
        <section className="rounded-2xl border border-neutral-800 p-4">
          <h2 className="mb-3 text-lg font-semibold">최근 대회 기록</h2>
          {recent.length === 0 ? (
            <div className="text-sm text-neutral-500">기록 없음</div>
          ) : (
            <ul className="space-y-2">
              {recent.map((r, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border border-neutral-800 px-3 py-2">
                  <div className="text-sm text-neutral-200">
                    {r.date} · {r.name} · {r.wins}W {r.losses}L
                  </div>
                  <div className={"text-sm font-semibold " + (r.eloDelta > 0 ? "text-orange-400" : r.eloDelta < 0 ? "text-red-400" : "text-neutral-400")}>
                    {r.eloDelta > 0 ? `+${r.eloDelta} PP` : `${r.eloDelta} PP`}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-black">
        <div className="mx-auto max-w-3xl px-4 py-4 text-center text-sm text-neutral-400">© MiniLive</div>
      </footer>

      {/* ───────────── Modals ───────────── */}

      {/* 테이블 확인 모달 */}
      {openTable && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-xl">
            <div className="mb-2 text-base font-semibold text-white">테이블 확인</div>
            <p className="text-sm text-neutral-300">현재 라운드의 테이블/상대 정보가 곧 표시됩니다.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpenTable(false)} className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-900">
                닫기
              </button>
              <button onClick={() => setOpenTable(false)} className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-black hover:bg-orange-400">
                착석 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 승패 입력 모달 */}
      {openReport && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-xl">
            <div className="mb-2 text-base font-semibold text-white">승패 입력</div>
            <p className="mb-3 text-xs text-neutral-400">입력 후에는 수정할 수 없으므로 다시 한 번 확인해주세요.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("예시: 제출 API 연결 예정");
                setOpenReport(false);
              }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <button type="button" className="flex-1 rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900">
                  승리
                </button>
                <button type="button" className="flex-1 rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900">
                  무승부
                </button>
                <button type="button" className="flex-1 rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900">
                  패배
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpenReport(false)} className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-900">
                  취소
                </button>
                <button type="submit" className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-black hover:bg-orange-400">
                  제출
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}