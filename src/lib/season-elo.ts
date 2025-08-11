export type MatchResult = "WIN" | "LOSS" | "DRAW";
export type BestOf = 1 | 3 | 5;

export const SEASON_BASE = 1500;

export function kFactorSeason(rating: number, gamesInSeason: number) {
  if (gamesInSeason < 10) return 64;
  if (rating >= 1900) return 24;
  return 40;
}

export function expectedScore(a: number, b: number) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

export function scoreOf(r: MatchResult) {
  return r === "WIN" ? 1 : r === "DRAW" ? 0.5 : 0;
}

export function bestOfMultiplier(bo: BestOf) {
  if (bo === 3) return 1.25;
  if (bo === 5) return 1.40;
  return 1.0;
}

export function drawMultiplier(r: MatchResult) {
  return r === "DRAW" ? 0.85 : 1.0;
}

export const MAX_DELTA_ABS = 60;

export function eloDeltaSeason(
  my: number,
  opp: number,
  myGamesInSeason: number,
  r: MatchResult,
  bo: BestOf = 1
) {
  const K = kFactorSeason(my, myGamesInSeason);
  const Ea = expectedScore(my, opp);
  const Sa = scoreOf(r);
  const raw = K * (Sa - Ea) * bestOfMultiplier(bo) * drawMultiplier(r);
  const delta = Math.round(raw);
  return Math.max(-MAX_DELTA_ABS, Math.min(MAX_DELTA_ABS, delta));
}

export function formatPP(pp: number) {
  return `${pp} PP`;
}

// 한글 티어
export type BallTier = "몬스터볼" | "슈퍼볼" | "하이퍼볼" | "마스터볼";

export function tierFromRating(rating: number, masterCut?: number): BallTier {
  if (typeof masterCut === "number" && rating >= 1700 && rating >= masterCut) return "마스터볼";
  if (rating >= 1700) return "하이퍼볼";
  if (rating >= 1500) return "슈퍼볼";
  return "몬스터볼";
}

export function computeHyperTop5Cut(ratingsDescHyperOnly: number[]): number | undefined {
  if (!ratingsDescHyperOnly.length) return undefined;
  const top5 = ratingsDescHyperOnly.slice(0, 5);
  return top5.length < 5 ? top5[top5.length - 1] : top5[4];
}

export function softResetForNextSeason(finalPP: number) {
  return Math.round(SEASON_BASE + (finalPP - SEASON_BASE) * 0.25);
}