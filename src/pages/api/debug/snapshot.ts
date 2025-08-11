import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const entries = await prisma.entry.findMany({
    include: { event: true, user: true },
    orderBy: [{ event: { date: "desc" } }, { id: "desc" }],
    take: 100,
  });
  res.json({ entries });
}