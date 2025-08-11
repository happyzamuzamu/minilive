// src/pages/api/events/[id]/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { tierFromRating, computeHyperTop5Cut, formatPP } from "@/lib/season-elo";
import { ballIconPath } from "@/lib/pp-icon";
import { RoundState } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const eventId = String(req.query.id);
  const userId = (req.headers["x-user-id"] as string) || "demo-user";

  // 현재 라운드(진행중)
  const round = await prisma.round.findFirst({
    where: { eventId, state: RoundState.RUNNING },
    orderBy: { number: "desc" },
  });
  if (!round) return res.json({ ok: true, hasMatch: false });

  // 내 매치
  const match = await prisma.match.findFirst({
    where: { eventId, roundId: round.id, OR: [{ p1Id: userId }, { p2Id: userId }] },
    include: {
      P1: { select: { id: true, nickname: true, rating: true, games: true } },
      P2: { select: { id: true, nickname: true, rating: true, games: true } },
    },
  });
  if (!match) return res.json({ ok: true, hasMatch: false });

  const meIsP1 = match.p1Id === userId;
  const me = meIsP1 ? match.P1! : match.P2!;
  const opp = meIsP1 ? match.P2! : match.P1!;

  // 마스터 컷
  const top5 = await prisma.user.findMany({
    where: { rating: { gte: 1700 } },
    orderBy: { rating: "desc" },
    take: 5,
    select: { rating: true },
  });
  const cut = computeHyperTop5Cut(top5.map(u => u.rating).sort((a,b)=>b-a));

  const myTier = tierFromRating(me.rating, cut);
  const oppTier = tierFromRating(opp.rating, cut);

  return res.json({
    ok: true,
    hasMatch: true,
    roundNo: round.number,
    tableNo: match.tableNo,
    me:   { id: me.id, nickname: me.nickname, rating: me.rating, pp: formatPP(me.rating), tier: myTier, icon: ballIconPath(myTier) },
    opp:  { id: opp.id, nickname: opp.nickname, rating: opp.rating, pp: formatPP(opp.rating), tier: oppTier, icon: ballIconPath(oppTier) },
  });
}