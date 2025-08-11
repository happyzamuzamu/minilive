import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

const DEMO_USER_ID = "demo-user";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { eventId, token, oneTime } = req.body as { eventId: string; token?: string; oneTime?: boolean };
  if (!eventId) return res.status(400).json({ error: "Missing eventId" });

  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      nickname: "Demo User",
      password: "dev",
      rating: 1350,
      tier: "Gold",
      games: 20,
    },
  });

  await prisma.event.upsert({
    where: { id: eventId },
    update: {},
    create: {
      id: eventId,
      name: `Event ${eventId}`,
      rounds: 5,
      bestOf: 1,
      format: "SWISS",
      state: "RUNNING",
      date: new Date(),
    },
  });

  const exists = await prisma.entry.findFirst({ where: { userId: DEMO_USER_ID, eventId } });
  if (!exists) {
    await prisma.entry.create({ data: { userId: DEMO_USER_ID, eventId, wins: 0, losses: 0, eloDelta: 0 } });
  }

  if (token && oneTime) {
    await prisma.qRToken.update({ where: { token }, data: { used: true } });
  }

  return res.status(200).json({ ok: true });
}