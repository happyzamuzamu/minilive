import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

function nextPow2(n: number) {
  let p = 1;
  while (p * 2 <= n) p *= 2;
  return p;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const eventId = String(req.query.id || "");
  if (!eventId) return res.status(400).json({ ok: false, error: "missing id" });
  const size = Math.max(2, Number(req.query.size || 8));

  const entries = await prisma.entry.findMany({ where: { eventId }, select: { userId: true } });
  const matches = await prisma.match.findMany({ where: { eventId }, select: { p1Id: true, p2Id: true, winnerId: true } });
  const points = new Map<string, number>();
  for (const e of entries) points.set(e.userId, 0);
  for (const m of matches) {
    if (!m.p1Id || !m.p2Id) continue;
    if (m.winnerId === m.p1Id) points.set(m.p1Id, (points.get(m.p1Id) || 0) + 3);
    else if (m.winnerId === m.p2Id) points.set(m.p2Id, (points.get(m.p2Id) || 0) + 3);
  }
  const seeds = entries
    .map(e => ({ id: e.userId, pts: points.get(e.userId) || 0 }))
    .sort((a, b) => b.pts - a.pts)
    .slice(0, size);
  const bracketSize = nextPow2(seeds.length);
  const trimmed = seeds.slice(0, bracketSize);
  if (trimmed.length < 2) return res.status(400).json({ ok: false, error: "not enough players" });

  const agg = await prisma.round.aggregate({ where: { eventId }, _max: { number: true } });
  let roundNo = (agg._max.number || 0) + 1;

  const firstRoundPairs: Array<[string, string]> = [];
  for (let i = 0; i < trimmed.length / 2; i++) {
    const a = trimmed[i].id;
    const b = trimmed[trimmed.length - 1 - i].id;
    firstRoundPairs.push([a, b]);
  }
  const firstRound = await prisma.round.create({ data: { eventId, number: roundNo } });
  const r1 = firstRoundPairs.map((p, i) => ({
    eventId,
    roundId: firstRound.id,
    tableNo: i + 1,
    p1Id: p[0],
    p2Id: p[1],
    reported: false
  }));
  await prisma.match.createMany({ data: r1 });

  const roundsToCreate = Math.log2(bracketSize) - 1;
  let created = r1.length;
  let prevIds = r1.map((_, i) => i + 1);
  for (let r = 0; r < roundsToCreate; r++) {
    roundNo += 1;
    const rr = await prisma.round.create({ data: { eventId, number: roundNo } });
    const pairCount = Math.ceil(prevIds.length / 2);
    const rows = Array.from({ length: pairCount }).map((_, i) => ({
      eventId,
      roundId: rr.id,
      tableNo: i + 1,
      p1Id: null as any,
      p2Id: null as any,
      reported: false
    }));
    await prisma.match.createMany({ data: rows });
    created += rows.length;
    prevIds = rows.map((_, i) => i + 1);
  }

  await prisma.event.update({ where: { id: eventId }, data: { state: "RUNNING" } });
  res.json({ ok: true, bracketSize, createdRounds: Math.log2(bracketSize), createdMatches: created });
}