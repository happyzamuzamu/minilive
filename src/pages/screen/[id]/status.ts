import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "invalid id" });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return res.status(404).json({ error: "event not found" });

  const latestRound = await prisma.round.findFirst({ where: { eventId: id }, orderBy: { id: "desc" } });

  let reportedInCurrentRound = 0;
  let totalMatchesInCurrentRound = 0;
  let remainingSec: number | null = null;

  if (latestRound) {
    totalMatchesInCurrentRound = await prisma.match.count({ where: { roundId: latestRound.id } });
    reportedInCurrentRound = await prisma.match.count({ where: { roundId: latestRound.id, reported: true } });
    if (event.roundLengthSec && event.roundStartedAt) {
      const elapsed = Math.floor((Date.now() - event.roundStartedAt.getTime()) / 1000);
      remainingSec = Math.max(0, event.roundLengthSec - elapsed);
    }
  }

  const currentRound = latestRound ? await prisma.round.count({ where: { eventId: id } }) : 0;

  return res.json({
    event: {
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      state: event.state,
      rounds: event.rounds,
      bestOf: event.bestOf,
      format: event.format,
      roundLengthSec: event.roundLengthSec ?? null,
    },
    currentRound,
    totalRounds: event.rounds,
    reportedInCurrentRound,
    totalMatchesInCurrentRound,
    remainingSec,
  });
}