import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import QRCode from "qrcode";

export default function QRScreen() {
  const { query } = useRouter();
  const eventId = String(query.id ?? "");
  const [dataUrl, setDataUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function createToken() {
    setError("");
    if (!eventId) { setError("eventId 없음"); return; }
    const r = await fetch(`/api/events/${eventId}/qr`, { method: "POST" });
    if (!r.ok) { setError(await r.text()); return; }
    const { joinUrl } = await r.json();
    const url = await QRCode.toDataURL(joinUrl, { margin: 1, scale: 8 });
    setDataUrl(url);
  }

  return (
    <>
      <Head><title>MiniLive | QR</title></Head>
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <button onClick={createToken} className="px-4 py-2 rounded-lg bg-accent text-black font-semibold">
          QR 생성하기
        </button>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {dataUrl && <img src={dataUrl} alt="Join QR" className="w-[40vmin] h-[40vmin]" />}
        <div className="opacity-80">스캔하여 체크인</div>
      </main>
    </>
  );
}