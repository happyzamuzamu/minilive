import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const eventId = String(req.query.id || "");
  if (!eventId) return res.status(400).json({ ok: false, error: "missing id" });

  let round = await prisma.round.aggregate({ where: { eventId }, _max: { number: true } });
  const n = round._max.number;
  if (typeof n !== "number") return res.status(200).json({ ok: true, eventId, roundNumber: 0, tables: [] });

  const r = await prisma.round.findFirst({ where: { eventId, number: n }, select: { id: true, number: true } });
  if (!r) return res.status(200).json({ ok: true, eventId, roundNumber: 0, tables: [] });

  const matches = await prisma.match.findMany({
    where: { eventId, roundId: r.id },
    select: { id: true, tableNo: true, p1Id: true, p2Id: true, reported: true },
    orderBy: [{ tableNo: "asc" }, { id: "asc" }]
  });

  if (matches.some(m => m.tableNo == null)) {
    const ordered = matches.map((m, i) => ({ id: m.id, tableNo: m.tableNo ?? i + 1 }));
    await prisma.$transaction(ordered.map(u => prisma.match.update({ where: { id: u.id }, data: { tableNo: u.tableNo } })));
    for (let i = 0; i < matches.length; i++) matches[i].tableNo = matches[i].tableNo ?? i + 1;
  }

  const ids = Array.from(new Set(matches.flatMap(m => [m.p1Id, m.p2Id]).filter((v): v is string => !!v)));
  const users = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, nickname: true } }) : [];
  const name = new Map(users.map(u => [u.id, u.nickname]));
  const tables = matches
    .slice()
    .sort((a, b) => (a.tableNo ?? 0) - (b.tableNo ?? 0) || a.id - b.id)
    .map(m => ({
      tableNo: m.tableNo ?? 0,
      matchId: m.id,
      p1Id: m.p1Id,
      p2Id: m.p2Id,
      p1Name: m.p1Id ? name.get(m.p1Id) ?? null : null,
      p2Name: m.p2Id ? name.get(m.p2Id) ?? null : null,
      reported: m.reported
    }));

  res.status(200).json({ ok: true, eventId, roundNumber: r.number, tables });
}