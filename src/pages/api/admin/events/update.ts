import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { id, name, date, rounds, bestOf, format, state, roundLengthSec } = req.body || {};
  if (!id) return res.status(400).json({ error: "id required" });
  const ev = await prisma.event.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(date ? { date: new Date(date) } : {}),
      ...(rounds != null ? { rounds: Number(rounds) } : {}),
      ...(bestOf != null ? { bestOf: Number(bestOf) } : {}),
      ...(format ? { format: String(format) } : {}),
      ...(state ? { state } : {}),
      ...(roundLengthSec != null ? { roundLengthSec: Number(roundLengthSec) } : {}),
    },
  });
  return res.json({ ok: true, event: ev });
}