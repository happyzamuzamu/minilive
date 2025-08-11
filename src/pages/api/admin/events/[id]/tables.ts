import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const eventId = String(req.query.id);
  const round = await prisma.round.findFirst({
    where: { eventId },
    orderBy: { number: "desc" },
    select: { id: true, number: true },
  });
  if (!round) return res.json({ roundNumber: 0, tables: [] });
  const matches = await prisma.match.findMany({
    where: { eventId, roundId: round.id },
    select: { id: true, tableNo: true, p1Id: true, p2Id: true },
    orderBy: [{ tableNo: "asc" }, { id: "asc" }],
  });
  const tables = matches.map((m) => ({
    tableNo: m.tableNo ?? 0,
    matchId: m.id,
    p1Id: m.p1Id,
    p2Id: m.p2Id,
  }));
  res.json({ roundNumber: round.number, tables });
}