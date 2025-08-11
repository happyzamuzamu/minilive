import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const eventId = req.query.id as string;
  const body = req.body as { topIds: number[]; bestOf?: number };
  const ids = body.topIds || [];
  const n = ids.length;
  if (n === 0) return res.json({ ok: false, reason: "no ids" });
  const power = (x: number) => (x & (x - 1)) === 0;
  if (!power(n)) return res.status(400).json({ ok: false, reason: "need power of two" });
  const round = await prisma.round.create({ data: { eventId, number: 1000 } });
  const data = [];
  let table = 1;
  for (let i = 0; i < n; i += 2) {
    data.push({
      eventId,
      roundId: round.id,
      tableNo: table++,
      p1Id: ids[i],
      p2Id: ids[i + 1],
      winnerId: null,
      reported: false,
      bestOf: body.bestOf ?? 3,
    } as any);
  }
  await prisma.match.createMany({ data });
  res.json({ ok: true, roundId: round.id, created: data.length });
}