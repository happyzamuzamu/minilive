// src/lib/pp-icon.ts
import type { BallTier } from "./season-elo";

export function ballIconPath(tier: BallTier): string {
  switch (tier) {
    case "마스터볼": return "/balls/master.webp";
    case "하이퍼볼": return "/balls/hyper.webp";
    case "슈퍼볼":   return "/balls/super.webp";
    default:         return "/balls/monster.webp";
  }
}

export function ballAltText(tier: BallTier): string {
  return tier;
}