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

    const active = await prisma.round.findFirst({
      where: { eventId, startedAt: { not: null }, endedAt: null },
      orderBy: { number: "desc" },
      select: { id: true, number: true },
    });
    if (!active) return res.status(409).end("ROUND_NOT_ACTIVE");

    const remaining = await prisma.match.count({
      where: { eventId, roundId: active.id, reported: false },
    });
    if (remaining > 0) return res.status(409).end("NOT_ALL_REPORTED");

    const now = new Date();
    await prisma.$transaction([
      prisma.round.update({ where: { id: active.id }, data: { endedAt: now } }),
      prisma.event.update({ where: { id: eventId }, data: { roundStartedAt: null } }),
    ]);

    return res.status(200).json({ ok: true, number: active.number, endedAt: now.toISOString() });
  } catch (e: any) {
    return res.status(500).end(e?.message || "INTERNAL_ERROR");
  }
}
