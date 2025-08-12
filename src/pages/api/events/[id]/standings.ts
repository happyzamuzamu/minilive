import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type Row = {
  entryId: number;
  nickname: string;
  points: number;
  wins: number;
  losses: number;
  omw: number;
  oow: number;
};

function avg(ns: number[]) {
  if (ns.length === 0) return 0;
  return ns.reduce((a, b) => a + b, 0) / ns.length;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const eventId = String(req.query.id);
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!event) return res.status(404).json({ error: "EVENT_NOT_FOUND" });

  const entries = await prisma.entry.findMany({
    where: { eventId },
    select: { id: true, userId: true },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: entries.map(e => e.userId) } },
    select: { id: true, nickname: true },
  });
  const nicknameByUser: Record<string, string> = {};
  users.forEach(u => (nicknameByUser[u.id] = u.nickname));

  const matches = await prisma.match.findMany({
    where: { eventId, reported: true },
    select: { id: true, p1Id: true, p2Id: true, winnerId: true },
  });

  const byEntryOpponents: Record<number, number[]> = {};
  const winsByEntry: Record<number, number> = {};
  const lossesByEntry: Record<number, number> = {};
  const gamesByEntry: Record<number, number> = {};
  entries.forEach(e => {
    byEntryOpponents[e.id] = [];
    winsByEntry[e.id] = 0;
    lossesByEntry[e.id] = 0;
    gamesByEntry[e.id] = 0;
  });

  for (const m of matches) {
    if (m.p1Id != null && m.p2Id != null) {
      byEntryOpponents[m.p1Id].push(m.p2Id);
      byEntryOpponents[m.p2Id].push(m.p1Id);
      gamesByEntry[m.p1Id] += 1;
      gamesByEntry[m.p2Id] += 1;
      if (m.winnerId === m.p1Id) {
        winsByEntry[m.p1Id] += 1;
        lossesByEntry[m.p2Id] += 1;
      } else if (m.winnerId === m.p2Id) {
        winsByEntry[m.p2Id] += 1;
        lossesByEntry[m.p1Id] += 1;
      }
    }
  }

  const winPctByEntry: Record<number, number> = {};
  entries.forEach(e => {
    const g = gamesByEntry[e.id];
    const w = winsByEntry[e.id];
    const pct = g > 0 ? w / g : 0;
    const floored = Math.max(0.25, pct);
    winPctByEntry[e.id] = floored;
  });

  const omwByEntry: Record<number, number> = {};
  entries.forEach(e => {
    const opps = byEntryOpponents[e.id];
    const vals = opps.map(oid => winPctByEntry[oid] ?? 0.25);
    omwByEntry[e.id] = avg(vals);
  });

  const oowByEntry: Record<number, number> = {};
  entries.forEach(e => {
    const opps = byEntryOpponents[e.id];
    const vals = opps.map(oid => omwByEntry[oid] ?? 0);
    oowByEntry[e.id] = avg(vals);
  });

  const rows: Row[] = entries.map(e => {
    const points = winsByEntry[e.id] * 3;
    const nickname = nicknameByUser[e.userId] ?? `Player ${e.id}`;
    return {
      entryId: e.id,
      nickname,
      points,
      wins: winsByEntry[e.id],
      losses: lossesByEntry[e.id],
      omw: omwByEntry[e.id] || 0,
      oow: oowByEntry[e.id] || 0,
    };
  });

  function headToHead(a: Row, b: Row) {
    let aBeatB = 0;
    let bBeatA = 0;
    for (const m of matches) {
      if (m.p1Id == null || m.p2Id == null) continue;
      const ab = (m.p1Id === a.entryId && m.p2Id === b.entryId) || (m.p1Id === b.entryId && m.p2Id === a.entryId);
      if (!ab) continue;
      if (m.winnerId === a.entryId) aBeatB++;
      if (m.winnerId === b.entryId) bBeatA++;
    }
    if (aBeatB > bBeatA) return -1;
    if (bBeatA > aBeatB) return 1;
    return 0;
  }

  rows.sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    if (Math.abs(y.omw - x.omw) > 1e-9) return y.omw - x.omw;
    if (Math.abs(y.oow - x.oow) > 1e-9) return y.oow - x.oow;
    const h = headToHead(x, y);
    if (h !== 0) return h;
    if (x.nickname < y.nickname) return -1;
    if (x.nickname > y.nickname) return 1;
    return 0;
  });

  const payload = rows.map((r, idx) => ({
    rank: idx + 1,
    entryId: r.entryId,
    nickname: r.nickname,
    points: r.points,
    wins: r.wins,
    losses: r.losses,
    omw: Number((r.omw * 100).toFixed(2)),
    oow: Number((r.oow * 100).toFixed(2)),
  }));

  res.json({ eventId, count: payload.length, standings: payload });
}