"use client";
import { useEffect, useMemo } from "react";
import useSWR from "swr";
import OpponentBadge from "@/componets/OpponentBadge";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Props = {
  eventId: string;
  open: boolean;
  onClose: () => void;
};

export default function OpponentDialog({ eventId, open, onClose }: Props) {
  const { data, mutate } = useSWR(open ? `/api/events/${eventId}/me` : null, fetcher, { refreshInterval: 3000 });
  const match = data?.match ?? data ?? null;

  const tableNo = match?.tableNo ?? match?.table ?? "-";
  const p1 = match?.P1 ?? match?.p1 ?? null;
  const p2 = match?.P2 ?? match?.p2 ?? null;
  const meId = data?.me?.id ?? data?.userId ?? null;

  const p1Nick = p1?.user?.nickname ?? p1?.nickname ?? p1?.name ?? match?.p1Name ?? "-";
  const p2Nick = p2?.user?.nickname ?? p2?.nickname ?? p2?.name ?? match?.p2Name ?? "-";

  const p1UserId = p1?.userId ?? p1?.user?.id ?? null;
  const p2UserId = p2?.userId ?? p2?.user?.id ?? null;

  const opponent = useMemo(() => {
    if (!p1 && !p2) return null;
    if (meId && p1UserId && String(p1UserId) === String(meId)) return p2 ?? null;
    if (meId && p2UserId && String(p2UserId) === String(meId)) return p1 ?? null;
    return p2 ?? p1 ?? null;
  }, [meId, p1, p2, p1UserId, p2UserId]);

  const opponentNickname = useMemo(() => {
    if (opponent) return opponent?.user?.nickname ?? opponent?.nickname ?? opponent?.name ?? "-";
    if (!meId) return p2Nick || p1Nick || "-";
    if (p1UserId && String(p1UserId) === String(meId)) return p2Nick || "-";
    if (p2UserId && String(p2UserId) === String(meId)) return p1Nick || "-";
    return p2Nick || p1Nick || "-";
  }, [opponent, meId, p1Nick, p2Nick, p1UserId, p2UserId]);

  const opponentPP: string = (() => {
    const u = opponent?.user ?? opponent ?? null;
    return (u?.pp ?? u?.points ?? u?.rating ?? "-") as string;
  })();

  const opponentTier: string = (() => {
    const u = opponent?.user ?? opponent ?? null;
    return (u?.tier ?? u?.rank ?? "-") as string;
  })();

  const opponentIcon: string = (() => {
    const u = opponent?.user ?? opponent ?? null;
    const src = (u?.icon ?? u?.avatar ?? u?.image ?? null) as string | null;
    return src ?? "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  })();

  const opponentScore: number | null =
    typeof match?.opponentScore === "number"
      ? match.opponentScore
      : typeof match?.score === "number"
      ? match.score
      : null;

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => mutate(), 5000);
    return () => clearInterval(id);
  }, [open, mutate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-black/10">
          <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: `"NeoDunggeunmo","Noto Sans KR",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif` }}>
            상대 확인
          </h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">테이블</span>
            <span className="text-base font-semibold">{tableNo}</span>
          </div>
          <div className="space-y-2">
            <span className="block text-sm text-gray-600">상대</span>
            <div className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2">
              <div className="min-w-0 truncate">
                <OpponentBadge nickname={opponentNickname} pp={String(opponentPP)} icon={opponentIcon} tier={String(opponentTier)} />
              </div>
              <div className="ml-3">
                {opponentScore != null ? (
                  <span className="inline-flex items-center rounded-lg border border-black/10 px-2 py-1 text-xs">
                    점수 {opponentScore}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">점수 정보 없음</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={onClose} className="rounded-xl border border-black/20 px-4 py-2">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
