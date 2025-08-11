// src/pages/api/leaderboard/top20.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { tierFromRating, computeHyperTop5Cut } from "@/lib/season-elo";
import { ballIconPath } from "@/lib/pp-icon";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const top = await prisma.user.findMany({
    orderBy: { rating: "desc" },
    take: 20,
    select: { id: true, nickname: true, rating: true, games: true },
  });

  const hyper5 = await prisma.user.findMany({
    where: { rating: { gte: 1700 } },
    orderBy: { rating: "desc" },
    take: 5,
    select: { rating: true },
  });
  const cut = computeHyperTop5Cut(hyper5.map(u => u.rating).sort((a,b)=>b-a));

  const rows = top.map(u => {
    const tier = tierFromRating(u.rating, cut);
    return { ...u, tier, icon: ballIconPath(tier) };
  });

  res.json({ ok: true, rows });
}