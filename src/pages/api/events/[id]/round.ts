import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const eventId = typeof idParam === "string" ? idParam.trim() : "";
  if (!eventId) return res.status(400).end("INVALID_EVENT_ID");

  if (req.method === "GET") {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, rounds: true, bestOf: true },
      });
      if (!event) return res.status(404).end("EVENT_NOT_FOUND");
      return res.status(200).json(event);
    } catch (e: any) {
      return res.status(500).end(e?.message || "INTERNAL_ERROR");
    }
  }

  res.setHeader("Allow", "GET");
  return res.status(405).end("Method Not Allowed");
}
