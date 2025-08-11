import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const eventId = req.query.id as string;

  if (req.method === "POST") {
    const action = (req.body?.action || req.query?.action || "start") as "start" | "end";
    if (action === "start") {
      const now = new Date();
      const updated = await prisma.event.update({
        where: { id: eventId },
        data: { roundStartedAt: now },
      });
      return res.json({ ok: true, roundStartedAt: updated.roundStartedAt });
    }
    await prisma.event.update({
      where: { id: eventId },
      data: { roundStartedAt: null },
    });
    return res.json({ ok: true });
  }

  if (req.method === "GET") {
    const ev = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, roundStartedAt: true, roundLengthSec: true },
    });
    if (!ev) return res.status(404).json({ ok: false, error: "not found" });
    return res.json({ ok: true, event: ev });
  }

  return res.status(405).end();
}