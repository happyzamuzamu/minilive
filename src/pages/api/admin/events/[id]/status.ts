import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }
  try {
    const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const eventId = typeof idParam === "string" ? idParam.trim() : "";
    if (!eventId) return res.status(400).end("INVALID_EVENT_ID");

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        entries: { select: { id: true } },
        roundsRel: { orderBy: { number: "desc" }, take: 1, select: { number: true } },
      },
    });
    if (!event) return res.status(404).end("EVENT_NOT_FOUND");

    const activeRound = await prisma.round.findFirst({
      where: { eventId, startedAt: { not: null }, endedAt: null },
      orderBy: { number: "desc" },
      select: { id: true, number: true, startedAt: true },
    });

    let totalMatches = 0;
    let reportedMatches = 0;
    if (activeRound) {
      totalMatches = await prisma.match.count({ where: { eventId, roundId: activeRound.id } });
      reportedMatches = await prisma.match.count({ where: { eventId, roundId: activeRound.id, reported: true } });
    }

    const isActive = Boolean(activeRound);
    const allReported = isActive ? totalMatches > 0 && totalMatches === reportedMatches : false;
    const participants = event.entries.length;
    const latestNumber = event.roundsRel[0]?.number ?? 0;
    const currentRoundNumber = activeRound?.number ?? latestNumber;
    const roundDurationSec = event.roundLengthSec ?? 0;

    return res.status(200).json({
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        format: event.format,
        rounds: event.rounds,
        bestOf: event.bestOf,
        participants,
        state: event.state,
      },
      round: {
        isActive,
        allReported,
        currentRoundNumber,
        totalMatches,
        reportedMatches,
        roundStartedAt: activeRound?.startedAt ?? event.roundStartedAt ?? null,
        roundDurationSec,
      },
      ok: true,
    });
  } catch (e: any) {
    return res.status(500).end(e?.message || "INTERNAL_ERROR");
  }
}
