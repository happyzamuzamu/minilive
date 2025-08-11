import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { EventState } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.query.key !== process.env.DEV_ADMIN_KEY) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  try {
    const eventId = "running-0811";

    // 이벤트 upsert (초기 상태는 DRAFT)
    await prisma.event.upsert({
      where: { id: eventId },
      update: { state: EventState.DRAFT },
      create: {
        id: eventId,
        name: "테스트 러닝 이벤트",
        state: EventState.DRAFT,
        date: new Date(),
        rounds: 5,
        bestOf: 1,
        format: "SWISS",
      },
    });

    // 참가자 + 엔트리
    const names = ["피카츄","이상해씨","파이리","꼬부기","잠만보","뮤","뮤츠","메타몽"];
    for (const name of names) {
      const userId = `u-${name}`;
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId, nickname: name, rating: 1500, games: 0 },
      });
      await prisma.entry.upsert({
        where: { userId_eventId: { userId, eventId } },
        update: {},
        create: { userId, eventId, wins: 0, losses: 0, eloDelta: 0 },
      });
    }

    return res.status(200).json({ ok: true, eventId, participants: names.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "bootstrap failed" });
  }
}