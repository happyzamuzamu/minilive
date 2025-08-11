import { prisma } from "@/lib/prisma";

export default async function handler(_: any, res: any) {
  const users = await prisma.user.count();
  const events = await prisma.event.count();
  const entries = await prisma.entry.count();
  const histories = await prisma.ratingHistory.count();

  const recent = await prisma.entry.findMany({
    include: { Event: true },
    orderBy: { Event: { date: "desc" } },
    take: 5,
  });

  res.status(200).json({
    counts: { users, events, entries, histories },
    sample: recent.map(r => ({
      event: r.Event.name,
      state: r.Event.state,
      date: r.Event.date,
      wins: r.wins,
      losses: r.losses,
      eloDelta: r.eloDelta
    }))
  });
}