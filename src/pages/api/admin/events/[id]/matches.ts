import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { RoundState } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  if (req.headers["x-admin"] !== "1") return res.status(403).json({ ok: false, error: "forbidden" });

  const eventId = String(req.query.id);
  const round = await prisma.round.findFirst({
    where: { eventId, state: RoundState.RUNNING },
    orderBy: { number: "desc" },
  });
  if (!round) return res.json({ ok: true, rows: [] });

  const rows = await prisma.match.findMany({
    where: { eventId, roundId: round.id },
    orderBy: { tableNo: "asc" },
    select: {
      id: true, tableNo: true, reported: true, winnerId: true,
      P1: { select: { id: true, nickname: true } },
      P2: { select: { id: true, nickname: true } },
    },
  });

  res.json({ ok: true, rows });
}