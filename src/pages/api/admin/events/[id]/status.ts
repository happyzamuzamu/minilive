import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const eventId = String(req.query.id);
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      state: true,
      format: true,
      bestOf: true,
      rounds: true,
      roundLengthSec: true,
      roundStartedAt: true,
      date: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!event) return res.status(404).json({ error: "not found" });
  const currentRound = await prisma.round.findFirst({
    where: { eventId },
    orderBy: { number: "desc" },
    select: { id: true, number: true, startedAt: true, endedAt: true },
  });
  res.json({
    event: {
      id: event.id,
      name: event.name,
      state: event.state,
      format: event.format,
      bestOf: event.bestOf,
      roundsPlanned: event.rounds,
      roundLengthSec: event.roundLengthSec,
      roundStartedAt: event.roundStartedAt,
    },
    round: currentRound
      ? {
          id: currentRound.id,
          number: currentRound.number,
          startedAt: currentRound.startedAt,
          endedAt: currentRound.endedAt,
        }
      : null,
  });
}