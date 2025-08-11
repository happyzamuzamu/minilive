import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Join() {
  const router = useRouter();
  const { token } = router.query;
  const [msg, setMsg] = useState("토큰 확인 중...");

  useEffect(() => {
    if (!router.isReady) return;
    const t = String(token ?? "");
    if (!t) { setMsg("토큰 누락"); return; }

    (async () => {
      try {
        const r = await fetch(`/api/join/${t}`);
        if (!r.ok) { setMsg(`토큰 검증 실패: ${await r.text()}`); return; }
        const data = await r.json();
        setMsg("체크인 중...");
        const r2 = await fetch(`/api/checkin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: data.eventId, token: t, oneTime: data.oneTime }),
        });
        if (!r2.ok) { setMsg(`체크인 실패: ${await r2.text()}`); return; }
        router.replace("/");
      } catch (e:any) {
        setMsg(`오류: ${e?.message ?? "unknown"}`);
      }
    })();
  }, [router.isReady, token, router]);

  return <main className="min-h-screen flex items-center justify-center text-sm opacity-90">{msg}</main>;
}