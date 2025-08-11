// src/pages/api/events/[id]/qr.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const eventId = String(req.query.id);
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  // 토큰 없이 eventId만 전달 (나중에 토큰 테이블 다시 도입 시 교체)
  const joinUrl = `${base}/join/${encodeURIComponent(eventId)}`;
  return res.json({ joinUrl });
}