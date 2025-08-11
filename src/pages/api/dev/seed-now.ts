import { prisma } from "@/lib/prisma";

export default async function handler(_: any, res: any) {
  const userId = "demo-user";

  // 1) 유저
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, nickname: "Demo User", password: "dev", rating: 1350, tier: "Gold", games: 20 },
  });

  // 2) 이벤트 2개(ENDED), 1개(RUNNING)
  const events = [
    { id: "weekly-0803", name: "위클리 리그", rounds: 5, state: "ENDED", date: new Date("2025-08-03") },
    { id: "cup-0810", name: "포켓몬 카드 컵", rounds: 6, state: "ENDED", date: new Date("2025-08-10") },
    { id: "running-0811", name: "미니라이브 오픈", rounds: 5, state: "RUNNING", date: new Date("2025-08-11") },
  ];

  for (const e of events) {
    await prisma.event.upsert({
      where: { id: e.id },
      update: { name: e.name, rounds: e.rounds, state: e.state, date: e.date },
      create: { id: e.id, name: e.name, rounds: e.rounds, bestOf: 1, format: "SWISS", state: e.state, date: e.date },
    });
  }

  // 3) 엔트리(최근 기록은 ENDED 만)
  const ensureEntry = async (eventId: string, wins: number, losses: number, eloDelta: number) => {
    const ex = await prisma.entry.findFirst({ where: { userId, eventId } });
    if (!ex) await prisma.entry.create({ data: { userId, eventId, wins, losses, eloDelta } });
  };
  await ensureEntry("weekly-0803", 3, 3, 0);
  await ensureEntry("cup-0810", 4, 2, 36);
  await ensureEntry("running-0811", 1, 0, 0);

  // 4) 레이팅 히스토리
  const ensureHistory = async (eventId: string, old: number, delta: number, next: number) => {
    const exists = await prisma.ratingHistory.findFirst({ where: { userId, eventId, old, delta, new: next } });
    if (!exists) await prisma.ratingHistory.create({ data: { userId, eventId, old, delta, new: next } });
  };
  await ensureHistory("weekly-0803", 1314, 0, 1314);
  await ensureHistory("cup-0810", 1314, 36, 1350);

  // 5) 확인용 집계
  const counts = {
    users: await prisma.user.count(),
    events: await prisma.event.count(),
    entries: await prisma.entry.count(),
    histories: await prisma.ratingHistory.count(),
  };

  res.status(200).json({ ok: true, counts });
}