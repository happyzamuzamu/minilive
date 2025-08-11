import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { tierFromRating, computeHyperTop5Cut, formatPP } from "@/lib/season-elo";
import { ballIconPath } from "@/lib/pp-icon";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  // TODO: 세션에서 가져오도록 변경. 지금은 데모 고정.
  const userId = (req.headers["x-user-id"] as string) || "demo-user";

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true, rating: true, games: true },
  });
  if (!me) return res.status(404).json({ ok: false, error: "User not found" });

  // 하이퍼(≥1700) 상위 5명 컷 → 마스터볼 계산용
  const topHyper = await prisma.user.findMany({
    where: { rating: { gte: 1700 } },
    orderBy: { rating: "desc" },
    take: 5,
    select: { rating: true },
  });
  const cut = computeHyperTop5Cut(topHyper.map(u => u.rating).sort((a, b) => b - a));
  const tier = tierFromRating(me.rating, cut);

  return res.json({
    ok: true,
    user: {
      id: me.id,
      nickname: me.nickname,
      rating: me.rating,
      pp: formatPP(me.rating),
      games: me.games,
      tier,
      icon: ballIconPath(tier),
    },
  });
}