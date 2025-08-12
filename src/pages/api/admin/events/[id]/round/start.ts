import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }
  try {
    const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const eventId = typeof idParam === "string" ? idParam.trim() : "";
    if (!eventId) return res.status(400).end("INVALID_EVENT_ID");

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).end("EVENT_NOT_FOUND");

    const alreadyActive = await prisma.round.findFirst({
      where: { eventId, startedAt: { not: null }, endedAt: null },
      select: { id: true },
    });
    if (alreadyActive) return res.status(409).end("ROUND_ALREADY_ACTIVE");

    const lastRound = await prisma.round.findFirst({
      where: { eventId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const nextNumber = (lastRound?.number ?? 0) + 1;

    const now = new Date();
    await prisma.$transaction([
      prisma.round.upsert({
        where: { eventId_number: { eventId, number: nextNumber } },
        update: { startedAt: now, endedAt: null },
        create: { eventId, number: nextNumber, startedAt: now },
      }),
      prisma.event.update({
        where: { id: eventId },
        data: { state: "RUNNING", roundStartedAt: now },
      }),
    ]);

    return res.status(200).json({ ok: true, number: nextNumber, startedAt: now.toISOString() });
  } catch (e: any) {
    return res.status(500).end(e?.message || "INTERNAL_ERROR");
  }
}
