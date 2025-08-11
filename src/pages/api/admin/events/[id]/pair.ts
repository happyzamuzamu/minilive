import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { swissBuildRound } from "@/lib/swiss";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const eventId = String(req.query.id);
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { bestOf: true } });
  if (!event) return res.status(404).json({ error: "event not found" });
  const result = await swissBuildRound(eventId, event.bestOf);
  res.json(result);
}