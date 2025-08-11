import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const eventId = String(req.query.id || "");
  if (!eventId) return res.status(400).json({ ok: false, error: "missing id" });
  await prisma.event.update({ where: { id: eventId }, data: { state: "ENDED" } });
  res.json({ ok: true });
}