import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { id, name, date, roundsCount, bestOf, format, roundLengthSec } = req.body || {};
  const created = await prisma.event.create({
    data: {
      id,
      name,
      date: new Date(date),
      roundsCount: Number(roundsCount ?? 0),
      bestOf: Number(bestOf ?? 1),
      format: String(format ?? "SWISS"),
      roundLengthSec: Number(roundLengthSec ?? 0),
      state: "DRAFT",
    } as any,
  });
  res.json({ ok: true, event: created });
}