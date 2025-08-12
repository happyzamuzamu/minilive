"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TierPill() {
  const { data } = useSWR("/api/pp/me", fetcher, { refreshInterval: 30000 });
  const tierKey =
    data?.tierKey ?? data?.tier ?? data?.rank ?? null;
  const tierName =
    data?.tierName ?? data?.name ?? (typeof tierKey === "string" ? tierKey : null);
  const points =
    typeof data?.points === "number" ? data.points :
    typeof data?.pp === "number" ? data.pp : null;

  const imgSrc =
    data?.icon ?? data?.image ??
    (tierKey ? `/pp/${tierKey}.svg` : null);

  if (!tierKey && points == null) return null;

  return (
    <div className="inline-flex items-center gap-2">
      {imgSrc && (
        <img
          src={imgSrc}
          alt={tierName ?? "tier"}
          width={24}
          height={24}
          className="inline-block"
        />
      )}
      {tierName && <span className="text-sm font-medium">{tierName}</span>}
      {typeof points === "number" && (
        <span className="text-sm text-gray-700">{points}pt</span>
      )}
    </div>
  );
}
