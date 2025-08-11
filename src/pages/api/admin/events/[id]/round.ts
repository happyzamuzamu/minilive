import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const eventId = String(req.query.id);
  if (req.method === "POST") {
    const now = new Date();
    await prisma.event.update({ where: { id: eventId }, data: { roundStartedAt: now, state: "RUNNING" } });
    const round = await prisma.round.findFirst({ where: { eventId }, orderBy: { number: "desc" } });
    return res.json({ ok: true, roundNumber: round?.number ?? 0, startedAt: now.toISOString() });
  }
  if (req.method === "PATCH") {
    await prisma.event.update({ where: { id: eventId }, data: { roundStartedAt: null } });
    const round = await prisma.round.findFirst({ where: { eventId }, orderBy: { number: "desc" } });
    if (round) await prisma.round.update({ where: { id: round.id }, data: { endedAt: new Date() } });
    return res.json({ ok: true });
  }
  return res.status(405).end();
}