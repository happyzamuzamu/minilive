"use client";
import { useState } from "react";

type Props = {
  eventId?: string | number;
  event?: string | number;
  onClose: () => void;
  onUpdated: () => Promise<any> | void;
};

export default function RoundEditModal({ eventId, event, onClose, onUpdated }: Props) {
  const eid = String(eventId ?? event ?? "");
  const [loading, setLoading] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundName, setRoundName] = useState<string>("");

  async function call(action: string, body: any = {}) {
    if (!eid) {
      setError("이벤트 ID가 비어 있습니다.");
      return;
    }
    setError(null);
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/events/${eid}/round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, roundName, ...body }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      await onUpdated?.();
    } catch (e: any) {
      setError(e?.message || "요청 실패");
    } finally {
      setLoading(null);
    }
  }

  if (!eid) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-black/10">
            <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: `"NeoDunggeunmo","Noto Sans KR",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif` }}>
              라운드 제어
            </h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="text-sm text-red-600">이벤트 ID가 전달되지 않아 작업을 진행할 수 없습니다.</div>
            <div className="flex justify-end">
              <button onClick={onClose} className="rounded-xl border border-black/20 px-4 py-2">닫기</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-black/10">
          <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: `"NeoDunggeunmo","Noto Sans KR",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif` }}>
            라운드 제어
          </h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm text-gray-600">라운드 이름</label>
            <input
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              placeholder="Round 1"
              className="w-full rounded-xl border border-black/20 px-3 py-2 outline-none"
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => call("pair")}
              disabled={loading !== null}
              className="rounded-xl border border-black/20 px-4 py-2 font-medium disabled:opacity-50"
            >
              {loading === "pair" ? "페어링..." : "스위스 페어링"}
            </button>
            <button
              onClick={() => call("start")}
              disabled={loading !== null}
              className="rounded-xl border border-black/20 px-4 py-2 font-medium disabled:opacity-50"
            >
              {loading === "start" ? "시작 중..." : "라운드 시작"}
            </button>
            <button
              onClick={() => call("end")}
              disabled={loading !== null}
              className="rounded-xl border border-black/20 px-4 py-2 font-medium disabled:opacity-50"
            >
              {loading === "end" ? "종료 중..." : "라운드 종료"}
            </button>
            <button
              onClick={() => call("reset")}
              disabled={loading !== null}
              className="rounded-xl border border-black/20 px-4 py-2 font-medium disabled:opacity-50"
            >
              {loading === "reset" ? "리셋 중..." : "라운드 리셋"}
            </button>
          </div>

          <div className="flex justify-end">
            <button onClick={onClose} className="rounded-xl border border-black/20 px-4 py-2">닫기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
