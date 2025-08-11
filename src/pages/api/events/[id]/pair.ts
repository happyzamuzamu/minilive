import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { RoundState } from "@prisma/client";
import { swissPairingOnce } from "@/lib/swiss";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  if (req.headers["x-admin"] !== "1") return res.status(403).json({ ok: false, error: "forbidden" });

  const eventId = String(req.query.id);

  const round = await prisma.round.findFirst({
    where: { eventId, state: RoundState.RUNNING },
    orderBy: { number: "desc" },
  });
  if (!round) return res.status(400).json({ ok: false, error: "no running round" });

  // 이미 페어가 생성되어 있으면 막기(보고 여부와 무관)
  const exists = await prisma.match.count({ where: { eventId, roundId: round.id } });
  if (exists > 0) return res.status(409).json({ ok: false, error: "pairs already exist" });

  const { pairs, tables } = await swissPairingOnce(eventId, round.id);
  return res.json({ ok: true, roundNo: round.number, pairs, tables });
}