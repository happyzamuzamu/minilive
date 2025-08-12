import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ ok: false });

  const id = req.query.id as string;
  if (!id) return res.status(400).json({ ok: false, error: "missing id" });

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      date: true,
      rounds: true,
      bestOf: true,
      format: true,
      state: true,
      roundLengthSec: true,
      roundStartedAt: true,
    },
  });
  if (!event) return res.status(404).json({ ok: false, error: "not found" });

  const entries = await prisma.entry.findMany({
    where: { eventId: id },
    include: { user: { select: { nickname: true } } },
  });

  const standings = entries
    .map((e) => ({
      nickname: e.user?.nickname ?? `Player#${e.userId}`,
      wins: e.wins ?? 0,
      losses: e.losses ?? 0,
      omw: null as number | null,
      gwp: null as number | null,
    }))
    .sort((a, b) => (b.wins - a.wins) || a.nickname.localeCompare(b.nickname))
    .map((row, i) => ({ rank: i + 1, ...row }));

  return res.json({
    ok: true,
    event,
    standings,
  });
}