import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { nickname } = (req.body ?? {}) as { nickname?: string };
    if (!nickname) return res.status(400).json({ ok: false, error: "nickname required" });

    const user = await prisma.user.upsert({
      where: { nickname },
      update: {},
      create: {
        id: nickname,
        nickname,
        rating: 1350,
      },
    });

    return res.json({ ok: true, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false });
  }
}