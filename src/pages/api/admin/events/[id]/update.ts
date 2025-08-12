import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type Body = {
  name?: string;
  date?: string;
  rounds?: number;
  bestOf?: number;
  format?: "SWISS" | "SE";
  roundLengthMin?: number;
  cap?: number | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  const id = req.query.id as string | undefined;
  if (!id) return res.status(400).json({ error: "MISSING_EVENT_ID" });

  let body: Body = {};
  try {
    body = req.body ?? {};
  } catch {
    return res.status(400).json({ error: "INVALID_JSON" });
  }

  const data: any = {};

  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.rounds === "number" && body.rounds > 0) data.rounds = Math.floor(body.rounds);
  if (body.bestOf === 1 || body.bestOf === 3) data.bestOf = body.bestOf;
  if (body.format === "SWISS" || body.format === "SE") data.format = body.format;

  if (typeof body.roundLengthMin === "number" && body.roundLengthMin > 0) {
    data.roundLengthSec = Math.floor(body.roundLengthMin * 60);
  }

  if (body.cap === null) data.cap = null;
  else if (typeof body.cap === "number" && body.cap >= 2) data.cap = Math.floor(body.cap);

  if (typeof body.date === "string" && body.date.trim()) {
    const d = body.date.includes("T") ? new Date(body.date) : new Date(`${body.date}T00:00:00`);
    if (isNaN(d.getTime())) return res.status(400).json({ error: "INVALID_DATE" });
    data.date = d;
  }

  if (Object.keys(data).length === 0) return res.status(400).json({ error: "NO_FIELDS_TO_UPDATE" });

  try {
    const event = await prisma.event.update({
      where: { id },
      data,
    });
    return res.status(200).json({ ok: true, event });
  } catch (e) {
    console.error("EVENT_UPDATE_FAILED", e);
    return res.status(500).json({ error: "EVENT_UPDATE_FAILED" });
  }
}