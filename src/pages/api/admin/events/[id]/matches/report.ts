import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { id } = req.query as { id: string };
  const { matchId, winnerEntryId, reported } = req.body as { matchId: number; winnerEntryId: number | null; reported: boolean };
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.eventId !== id) return res.status(404).json({ ok: false, error: "not-found" });
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { reported, winnerId: winnerEntryId },
    include: { P1: true, P2: true }
  });
  res.json({ ok: true, match: updated });
}