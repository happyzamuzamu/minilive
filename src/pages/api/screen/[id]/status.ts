import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ ok: false, error: "Invalid id" });

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      state: true,
      roundLengthSec: true,
      roundStartedAt: true,
      rounds: true,
    },
  });
  if (!event) return res.status(404).json({ ok: false, error: "Not found" });

  const startedAt = event.roundStartedAt ? new Date(event.roundStartedAt) : null;
  const now = new Date();
  const elapsed = startedAt ? Math.floor((now.getTime() - startedAt.getTime()) / 1000) : 0;
  const remainingSec = Math.max(0, (event.roundLengthSec ?? 0) - elapsed);

  const agg = await prisma.round.aggregate({
    where: { eventId: id },
    _max: { number: true },
  });
  const roundNumber = agg._max.number ?? 0;

  res.json({
    ok: true,
    event: { id: event.id, name: event.name },
    state: event.state,
    round: { number: roundNumber, remainingSec },
  });
}