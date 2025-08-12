import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { id } = req.query as { id: string };
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return res.status(404).json({ ok: false, error: "event-not-found" });
  const current = await prisma.round.findFirst({ where: { eventId: id }, orderBy: { number: "desc" } });
  if (!current) return res.status(400).json({ ok: false, error: "no-round" });
  const unreported = await prisma.match.count({ where: { eventId: id, roundId: current.id, reported: false } });
  if (unreported > 0) return res.status(409).json({ ok: false, error: "pending-matches", count: unreported });
  await prisma.round.update({ where: { id: current.id }, data: { endedAt: new Date() } });
  res.json({ ok: true });
}