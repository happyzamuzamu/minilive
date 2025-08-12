import { useEffect, useMemo, useRef, useState } from "react";

type EventLite = {
  id: string;
  name: string;
  rounds: number;
  bestOf: number;
};

type Props = {
  event: EventLite | null;
  onClose: () => void;
  onUpdated: () => Promise<any>;
};

export default function RoundEditModal({ event, onClose, onUpdated }: Props) {
  const [roundNumber, setRoundNumber] = useState<number>(event?.rounds ?? 1);
  const [bestOf, setBestOf] = useState<number>(event?.bestOf ?? 1);
  const [startNow, setStartNow] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = !!event?.id && Number.isFinite(roundNumber) && roundNumber >= 1 && (bestOf === 1 || bestOf === 3);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setRoundNumber(event?.rounds ?? 1);
    setBestOf(event?.bestOf ?? 1);
  }, [event?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const t = setTimeout(() => firstInputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);

  const title = useMemo(() => `라운드 설정${event ? ` — ${event.name}` : ""}`, [event?.name]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) {
      setError("입력 값을 다시 확인하세요.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/admin/events/${encodeURIComponent(event!.id)}/round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: roundNumber,
          bestOf,
          startNow,
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `ROUND_UPDATE_FAILED (${res.status})`);
      }
      await onUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "라운드 업데이트에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-black/10">
        <div className="px-5 py-4 border-b border-black/10">
          <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: `"NeoDunggeunmo", "Noto Sans KR", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif` }}>
            {title}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ fontFamily: `"Noto Sans KR", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif` }}>라운드 번호</label>
            <input
              ref={firstInputRef}
              type="number"
              min={1}
              step={1}
              value={Number.isFinite(roundNumber) ? roundNumber : ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                const n = v === "" ? NaN : parseInt(v, 10);
                setRoundNumber(n);
              }}
              className="w-full rounded-xl border border-black/20 px-3 py-2 outline-none focus:ring focus:ring-black/20"
              disabled={!event || submitting}
              required
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ fontFamily: `"Noto Sans KR", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif` }}>Best of</label>
            <select
              value={bestOf}
              onChange={(e) => setBestOf(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-black/20 px-3 py-2"
              disabled={!event || submitting}
            >
              <option value={1}>Bo1</option>
              <option value={3}>Bo3</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm" style={{ fontFamily: `"Noto Sans KR", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif` }}>
            <input
              type="checkbox"
              checked={startNow}
              onChange={(e) => setStartNow(e.target.checked)}
              disabled={!event || submitting}
            />
            지금 시작으로 처리 (타이머/매치 즉시 준비)
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/20 px-4 py-2"
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
              disabled={!canSubmit || submitting}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit && !submitting) handleSubmit();
              }}
            >
              {submitting ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
