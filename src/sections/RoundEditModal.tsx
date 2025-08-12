import { useState } from "react";

type Props = {
  event: {
    id: string;
    name: string;
    rounds: number;
    bestOf: number;
  } | null;
  onClose: () => void;
  onUpdated: () => Promise<any>;
};

export default function RoundEditModal({ event, onClose, onUpdated }: Props) {
  // 방어코드: event 없으면 disabled 상태로 렌더
  const [roundNumber, setRoundNumber] = useState<number>(event?.rounds ?? 1);
  const [bestOf, setBestOf] = useState<number>(event?.bestOf ?? 1);
  const [startNow, setStartNow] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event?.id) {
      alert("이벤트 ID를 찾을 수 없습니다.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/events/${event.id}/round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: roundNumber,
          bestOf,
          startNow, // 서버에서 즉시 시작/시간 설정 등에 활용
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `ROUND_UPDATE_FAILED (${res.status})`);
      }

      await onUpdated(); // SWR mutate 등
      onClose();
    } catch (err: any) {
      console.error("ROUND_UPDATE_FAILED", err);
      alert("라운드 업데이트에 실패했습니다.\n" + (err?.message ?? ""));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-bold">
            라운드 설정 {event ? `— ${event.name}` : ""}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">라운드 번호</label>
            <input
              type="number"
              min={1}
              value={roundNumber}
              onChange={(e) => setRoundNumber(parseInt(e.target.value || "1", 10))}
              className="w-full rounded-md border px-3 py-2"
              disabled={!event}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Best of</label>
            <select
              value={bestOf}
              onChange={(e) => setBestOf(parseInt(e.target.value, 10))}
              className="w-full rounded-md border px-3 py-2"
              disabled={!event}
            >
              <option value={1}>Bo1</option>
              <option value={3}>Bo3</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={startNow}
              onChange={(e) => setStartNow(e.target.checked)}
              disabled={!event}
            />
            지금 시작으로 처리 (타이머/매치 즉시 준비)
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2"
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
              disabled={!event || submitting}
            >
              {submitting ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}