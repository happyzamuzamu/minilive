"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function EndRoundPage() {
  const router = useRouter();
  const eventId = router.query.id as string;
  const [msg, setMsg] = useState("Ending...");

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        const r = await fetch(`/api/admin/events/${eventId}/round/end`, { method: "POST", headers: { "Content-Type": "application/json" } });
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          throw new Error(t || `ROUND_END_FAILED (${r.status})`);
        }
        setMsg("OK");
      } catch (e: any) {
        setMsg(e?.message || "ROUND_END_FAILED");
      } finally {
        router.replace(`/admin/event/${eventId}`);
      }
    })();
  }, [eventId, router]);

  return <div className="p-6">{msg}</div>;
}
