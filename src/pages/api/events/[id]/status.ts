import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

async function getCurrentRoundSafe(eventId: string): Promise<number> {
  // 1) Round 테이블이 있고, number 컬럼이 있을 때 (권장 스키마)
  try {
    const agg = await (prisma as any).round.aggregate({
      where: { eventId },
      _max: { number: true },
    });
    const n = agg?._max?.number;
    if (typeof n === "number" && !isNaN(n)) return n;
  } catch {}

  // 2) number 대신 index 컬럼을 쓰는 스키마일 때
  try {
    const agg = await (prisma as any).round.aggregate({
      where: { eventId },
      _max: { index: true },
    });
    const n = agg?._max?.index;
    if (typeof n === "number" && !isNaN(n)) return n;
  } catch {}

  // 3) Round 모델이 없거나 컬럼을 모를 때: 매치의 roundId 중 최대값을 사용 (차선)
  try {
    const agg = await prisma.match.aggregate({
      where: { eventId },
      _max: { roundId: true },
    });
    const n = (agg._max as any)?.roundId ?? 0;
    if (typeof n === "number" && !isNaN(n)) return n;
  } catch {}

  return 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).end();
    return;
  }

  const eventId = String(req.query.id || "");
  if (!eventId) {
    res.status(400).json({ ok: false, error: "missing id" });
    return;
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, name: true, state: true, rounds: true, bestOf: true, format: true, date: true },
  });

  if (!event) {
    res.status(200).json({
      ok: true,
      exists: false,
      eventId,
      headcount: 0,
      reported: 0,
      currentRound: 0,
      timer: null,
    });
    return;
  }

  const headcount = await prisma.entry.count({ where: { eventId } });

  let reported = 0;
  try {
    // 우리 스키마는 reported(boolean)만 존재
    reported = await prisma.match.count({ where: { eventId, reported: true } });
  } catch {
    reported = 0;
  }

  const currentRound = await getCurrentRoundSafe(eventId);

  res.status(200).json({
    ok: true,
    exists: true,
    event,
    headcount,
    reported,
    currentRound,
    timer: null,
  });
}