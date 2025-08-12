import { useEffect, useState } from "react";

type Props = {
  event: any | null;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EventEditModal({ event, onClose, onUpdated }: Props) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [rounds, setRounds] = useState<number | "">("");
  const [bestOf, setBestOf] = useState<number | "">("");
  const [format, setFormat] = useState<"SWISS" | "ELIM" | "">("");
  const [roundLengthMin, setRoundLengthMin] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!event) return;
    setName(event.name ?? "");
    if (event.date) {
      const d = typeof event.date === "string" ? new Date(event.date) : event.date;
      const iso = !isNaN(new Date(d).getTime()) ? new Date(d).toISOString().slice(0, 10) : "";
      setDate(iso);
    } else {
      setDate("");
    }
    setRounds(event.rounds ?? "");
    setBestOf(event.bestOf ?? "");
    setFormat(event.format ?? "");
    setRoundLengthMin(event.roundLengthSec ? Math.round(Number(event.roundLengthSec) / 60) : "");
  }, [event]);

  async function save() {
    if (!event?.id) return;
    setSaving(true);
    setErr(null);

    const payload: any = { id: event.id };

    if (name !== event.name) payload.name = name;
    if (date) payload.date = date;
    if (rounds !== "" && rounds !== event.rounds) payload.rounds = Number(rounds);
    if (bestOf !== "" && bestOf !== event.bestOf) payload.bestOf = Number(bestOf);
    if (format && format !== event.format) payload.format = format;
    if (roundLengthMin !== "" && Number(roundLengthMin) * 60 !== event.roundLengthSec) {
      payload.roundLengthSec = Number(roundLengthMin) * 60;
    }

    try {
      const r = await fetch("/api/admin/events/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const t = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(typeof t?.error === "string" ? t.error : "UPDATE_FAILED");
      } else {
        onUpdated();
        onClose();
      }
    } catch {
      setErr("NETWORK_ERROR");
    } finally {
      setSaving(false);
    }
  }

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <h2 className="mb-3 text-lg font-bold">대회 설정 수정</h2>

        <label className="mb-2 block text-sm">대회명</label>
        <input className="mb-4 w-full rounded border p-2" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="mb-2 block text-sm">대회 날짜</label>
        <input className="mb-4 w-full rounded border p-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm">라운드 수</label>
            <input
              className="w-full rounded border p-2"
              inputMode="numeric"
              value={rounds}
              onChange={(e) => setRounds(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="예: 5"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm">Best-of</label>
            <select
              className="w-full rounded border p-2"
              value={bestOf}
              onChange={(e) => setBestOf(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">선택</option>
              <option value={1}>Bo1</option>
              <option value={3}>Bo3</option>
            </select>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm">형식</label>
            <select
              className="w-full rounded border p-2"
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
            >
              <option value="">선택</option>
              <option value="SWISS">Swiss</option>
              <option value="ELIM">Single Elimination</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm">라운드 시간(분)</label>
            <input
              className="w-full rounded border p-2"
              inputMode="numeric"
              value={roundLengthMin}
              onChange={(e) => setRoundLengthMin(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="예: 50"
            />
          </div>
        </div>

        {err && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{err}</div>}

        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded border px-3 py-2" onClick={onClose} disabled={saving}>취소</button>
          <button className="rounded bg-black px-3 py-2 text-white disabled:opacity-50" onClick={save} disabled={saving}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}