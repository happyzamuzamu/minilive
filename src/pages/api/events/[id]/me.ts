import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const eventId = String(req.query.id);
  const userId = "demo-user";
  const myEntry = await prisma.entry.findFirst({ where: { eventId, userId } });
  if (!myEntry) return res.status(404).json({ error: "not registered" });
  const round = await prisma.round.findFirst({
    where: { eventId },
    orderBy: { number: "desc" },
    select: { id: true, number: true },
  });
  if (!round) return res.json({ roundNumber: 0, my: null });
  const match = await prisma.match.findFirst({
    where: { eventId, roundId: round.id, OR: [{ p1Id: myEntry.id }, { p2Id: myEntry.id }] },
    include: {
      P1: { include: { user: { select: { nickname: true } } } },
      P2: { include: { user: { select: { nickname: true } } } },
    },
  });
  if (!match) return res.json({ roundNumber: round.number, my: null });
  const meIsP1 = match.p1Id === myEntry.id;
  const oppNick = meIsP1 ? match.P2?.user.nickname ?? null : match.P1?.user.nickname ?? null;
  res.json({
    roundNumber: round.number,
    my: {
      tableNo: match.tableNo,
      opponentNickname: oppNick,
      reported: match.reported,
    },
  });
}