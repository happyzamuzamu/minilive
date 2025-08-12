import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type Body = {
  number?: number;
  op?: "start" | "end" | "pair";
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const { id } = req.query;
  const { number, op } = req.body as Body;

  if (typeof id !== "string") {
    return res.status(400).json({ ok: false, error: "INVALID_EVENT_ID" });
  }
  if (!number || number < 1) {
    return res.status(400).json({ ok: false, error: "INVALID_ROUND_NUMBER" });
  }
  if (!op) {
    return res.status(400).json({ ok: false, error: "MISSING_OP" });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return res.status(404).json({ ok: false, error: "EVENT_NOT_FOUND" });
  }

  // 라운드 확보(upsert)
  let round = await prisma.round.findUnique({
    where: { eventId_number: { eventId: id, number } },
  });

  if (!round) {
    round = await prisma.round.create({
      data: { eventId: id, number },
    });
  }

  try {
    if (op === "start") {
      await prisma.round.update({
        where: { eventId_number: { eventId: id, number } },
        data: { startedAt: new Date(), endedAt: null },
      });
      return res.json({ ok: true, action: "started" });
    }

    if (op === "end") {
      await prisma.round.update({
        where: { eventId_number: { eventId: id, number } },
        data: { endedAt: new Date() },
      });
      return res.json({ ok: true, action: "ended" });
    }

    if (op === "pair") {
      // 이미 생성된 매치가 있으면 재생성 방지(필요시 삭제 후 재생성 로직으로 바꿀 수 있음)
      const existing = await prisma.match.count({
        where: { eventId: id, roundId: round.id },
      });
      if (existing > 0) {
        return res.json({ ok: true, action: "pair_skipped_existing", count: existing });
      }

      // 엔트리 불러와서 (wins desc, losses asc, createdAt asc) 기준 정렬
      const entries = await prisma.entry.findMany({
        where: { eventId: id },
        orderBy: [{ wins: "desc" }, { losses: "asc" }, { createdAt: "asc" }],
      });

      // 간단 페어링: 위에서부터 2명씩 짝
      // (TPCi 스위스 타이브레이커는 별도 계산, 여기서는 페어링만 생성)
      const pairs: { p1Id: number | null; p2Id: number | null }[] = [];
      for (let i = 0; i < entries.length; i += 2) {
        const p1 = entries[i];
        const p2 = entries[i + 1];
        pairs.push({ p1Id: p1?.id ?? null, p2Id: p2?.id ?? null });
      }

      // 매치 생성
      let table = 1;
      const toCreate = pairs
        .filter((p) => p.p1Id && p.p2Id) // 홀수면 마지막은 드랍(필요시 bye 처리)
        .map((p) => ({
          eventId: id,
          roundId: round!.id,
          tableNo: table++,
          p1Id: p.p1Id!,
          p2Id: p.p2Id!,
          reported: false,
        }));

      const result = await prisma.match.createMany({ data: toCreate });

      return res.json({ ok: true, action: "paired", count: result.count });
    }

    return res.status(400).json({ ok: false, error: "UNKNOWN_OP" });
  } catch (e: any) {
    console.error("ROUND_UPDATE_FAILED", e);
    return res.status(500).json({ ok: false, error: "ROUND_UPDATE_FAILED" });
  }
}