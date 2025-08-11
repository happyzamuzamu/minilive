// src/pages/api/profile/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { tierFromRating, computeHyperTop5Cut, formatPP } from "@/lib/season-elo";
import { ballIconPath } from "@/lib/pp-icon";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const userId = "demo-user"; // TODO: 세션으로 교체

  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me) return res.status(404).json({ ok: false });

  const hyperTop = await prisma.user.findMany({
    where: { rating: { gte: 1700 } },
    orderBy: { rating: "desc" },
    take: 5,
    select: { rating: true },
  });
  const cut = computeHyperTop5Cut(hyperTop.map(u => u.rating).sort((a,b)=>b-a));
  const tier = tierFromRating(me.rating, cut);

  // 최근 대회 기록(Entry 기준)
  const recent = await prisma.entry.findMany({
    where: { userId },
    orderBy: { id: "desc" },
    take: 10,
    select: { eventId: true, wins: true, losses: true, eloDelta: true },
  });

  return res.json({
    ok: true,
    user: {
      id: me.id,
      nickname: me.nickname,
      rating: me.rating,
      pp: formatPP(me.rating),
      tier,
      icon: ballIconPath(tier),
      games: me.games,
    },
    recent, // {eventId, wins, losses, eloDelta}
  });
}