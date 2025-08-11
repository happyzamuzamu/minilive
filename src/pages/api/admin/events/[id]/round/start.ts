import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const eventId = String(req.query.id || "");
  if (!eventId) return res.status(400).json({ ok: false, error: "missing id" });

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, rounds: true } });
  if (!event) return res.status(404).json({ ok: false, error: "not found" });

  const max = await prisma.round.aggregate({ where: { eventId }, _max: { number: true } });
  const current = max._max.number || 0;
  const next = current + 1;
  if (next > event.rounds) return res.status(400).json({ ok: false, error: "all rounds completed" });

  const r = await prisma.round.create({ data: { eventId, number: next } });
  res.json({ ok: true, roundId: r.id, roundNumber: r.number, startedAt: r.createdAt.getTime() });
}