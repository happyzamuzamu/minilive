// src/pages/api/join/[token].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { EventState } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const eventId = String(req.query.token); // 임시: token=eventId
  const userId = (req.body?.userId as string) || "demo-user";
  const nickname = (req.body?.nickname as string) || "guest";

  await prisma.user.upsert({
    where: { id: userId },
    update: { nickname },
    create: { id: userId, nickname },
  });

  await prisma.event.upsert({
    where: { id: eventId },
    update: { state: EventState.RUNNING },
    create: {
      id: eventId,
      name: eventId,
      date: new Date(),
      rounds: 5,
      bestOf: 1,
      format: "SWISS",
      state: EventState.RUNNING,
    },
  });

  await prisma.entry.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: {},
    create: { userId, eventId },
  });

  return res.json({ ok: true });
}