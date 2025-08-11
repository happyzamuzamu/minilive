import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { id, name, date, rounds, bestOf, format, state, roundLengthSec } = req.body || {};
  if (!id || !name || !date || !rounds || !bestOf || !format || !state) return res.status(400).json({ error: "invalid payload" });
  const ev = await prisma.event.create({
    data: {
      id,
      name,
      date: new Date(date),
      rounds: Number(rounds),
      bestOf: Number(bestOf),
      format: String(format),
      state,
      roundLengthSec: roundLengthSec == null ? null : Number(roundLengthSec),
      roundStartedAt: null,
    },
  });
  return res.json({ ok: true, event: ev });
}