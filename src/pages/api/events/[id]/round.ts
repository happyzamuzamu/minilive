import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { RoundState } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  if (req.headers["x-admin"] !== "1") return res.status(403).json({ ok: false, error: "forbidden" });

  const eventId = String(req.query.id);
  const { action } = (req.body || {}) as { action: "start" | "end" };

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ ok: false, error: "event not found" });

  if (action === "end") {
    // 진행중 라운드 -> LOCKED
    const running = await prisma.round.findFirst({
      where: { eventId, state: RoundState.RUNNING },
      orderBy: { number: "desc" },
    });
    if (!running) return res.json({ ok: true, changed: false });
    await prisma.round.update({ where: { id: running.id }, data: { state: RoundState.LOCKED, endsAt: new Date() } });
    return res.json({ ok: true, changed: true, roundNo: running.number });
  }

  if (action === "start") {
    // 다음 라운드 번호 계산
    const last = await prisma.round.findFirst({
      where: { eventId },
      orderBy: { number: "desc" },
    });
    const nextNo = (last?.number || 0) + 1;
    // 신규 RUNNING 생성
    const created = await prisma.round.create({
      data: { eventId, number: nextNo, state: RoundState.RUNNING, startsAt: new Date() },
    });
    return res.json({ ok: true, roundId: created.id, roundNo: created.number });
  }

  return res.status(400).json({ ok: false, error: "invalid action" });
}