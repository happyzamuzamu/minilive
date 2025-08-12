import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { eventId, nickname } = req.body || {};
  if (!eventId || !nickname) return res.status(400).json({ error: "eventId and nickname required" });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ error: "event not found" });

  const user = await prisma.user.upsert({
    where: { nickname },
    update: {},
    create: { id: `guest-${Date.now()}`, nickname, password: "guest", rating: 1350 },
  });

  const exists = await prisma.entry.findUnique({
    where: { userId_eventId: { userId: user.id, eventId } },
  });
  if (exists) return res.status(409).json({ error: "already entered" });

  const entry = await prisma.entry.create({
    data: { userId: user.id, eventId, wins: 0, losses: 0, eloDelta: 0 },
  });

  return res.status(200).json({ ok: true, entryId: entry.id });
}