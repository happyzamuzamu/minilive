// src/components/OpponentBadge.tsx
import Image from "next/image";

type Props = { nickname: string; pp: string; icon: string; tier: string };

export default function OpponentBadge({ nickname, pp, icon, tier }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <Image src={icon} alt={tier} width={20} height={20} />
      <div className="leading-tight">
        <div className="text-white text-sm font-semibold">{nickname}</div>
        <div className="text-white/70 text-xs">{pp} · {tier}</div>
      </div>
    </div>
  );
}