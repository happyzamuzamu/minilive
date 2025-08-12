import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { id } = req.query;
  const { number, startedAt, endedAt } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: "missing id" });

  const event = await prisma.event.findUnique({ where: { id: String(id) } });
  if (!event) return res.status(404).json({ ok: false, error: "event not found" });

  let round = await prisma.round.findFirst({ where: { eventId: String(id), number: Number(number) } });
  if (!round) {
    round = await prisma.round.create({
      data: {
        eventId: String(id),
        number: Number(number ?? 1),
        startedAt: startedAt ? new Date(startedAt) : null,
        endedAt: endedAt ? new Date(endedAt) : null,
      },
    });
  } else {
    round = await prisma.round.update({
      where: { id: round.id },
      data: {
        number: Number(number ?? round.number),
        startedAt: startedAt === null ? null : startedAt ? new Date(startedAt) : round.startedAt,
        endedAt: endedAt === null ? null : endedAt ? new Date(endedAt) : round.endedAt,
      },
    });
  }

  return res.json({ ok: true, round });
}