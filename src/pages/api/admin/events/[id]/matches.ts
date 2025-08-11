import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const eventId = String(req.query.id);
  const round = await prisma.round.findFirst({
    where: { eventId },
    orderBy: { number: "desc" },
    select: { id: true, number: true },
  });
  if (!round) return res.json({ roundNumber: 0, matches: [] });
  const matches = await prisma.match.findMany({
    where: { eventId, roundId: round.id },
    include: {
      P1: { include: { user: { select: { nickname: true } } } },
      P2: { include: { user: { select: { nickname: true } } } },
    },
    orderBy: [{ tableNo: "asc" }, { id: "asc" }],
  });
  const data = matches.map((m) => ({
    id: m.id,
    tableNo: m.tableNo,
    p1Id: m.p1Id,
    p2Id: m.p2Id,
    p1Nickname: m.P1?.user.nickname ?? null,
    p2Nickname: m.P2?.user.nickname ?? null,
    winnerId: m.winnerId,
    reported: m.reported,
  }));
  res.json({ roundNumber: round.number, matches: data });
}