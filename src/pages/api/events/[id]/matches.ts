import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: "Missing event id" });

  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, bestOf: true },
  });
  if (!event) return res.status(404).json({ error: "Event not found" });

  const round = await prisma.round.findFirst({
    where: { eventId: id },
    orderBy: { number: "desc" },
    select: { id: true, number: true },
  });
  if (!round) return res.status(200).json({ roundNumber: 0, bestOf: event.bestOf, matches: [] });

  const matches = await prisma.match.findMany({
    where: { eventId: id, roundId: round.id },
    orderBy: [{ tableNo: "asc" }, { id: "asc" }],
    include: {
      P1: { include: { user: { select: { nickname: true } } } },
      P2: { include: { user: { select: { nickname: true } } } },
      Winner: { include: { user: { select: { nickname: true } } } },
    },
  });

  const data = matches.map((m) => ({
    id: m.id,
    tableNo: m.tableNo,
    reported: m.reported,
    p1Id: m.p1Id,
    p2Id: m.p2Id,
    winnerId: m.winnerId,
    p1Nickname: m.P1?.user.nickname ?? null,
    p2Nickname: m.P2?.user.nickname ?? null,
    winnerNickname: m.Winner?.user.nickname ?? null,
  }));

  res.status(200).json({
    roundId: round.id,
    roundNumber: round.number,
    bestOf: event.bestOf,
    matches: data,
  });
}