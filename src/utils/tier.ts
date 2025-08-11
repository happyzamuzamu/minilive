// 볼 티어 판정 + 아이콘 경로
export type BallTier = "MonsterBall" | "SuperBall" | "HyperBall" | "MasterBall";

// 기존 ratingToBall 유지하되, 마스터 조건을 "하이퍼 이상 + top5Cutoff" 둘 다 만족으로 강화
export function ratingToBall(rating: number, top5Cutoff?: number): BallTier {
  const HYPER_FLOOR = 1700;

  // 마스터: 하이퍼 이상 중 Top5
  if (typeof top5Cutoff === "number" && rating >= HYPER_FLOOR && rating >= top5Cutoff) {
    return "MasterBall";
  }
  if (rating >= HYPER_FLOOR) return "HyperBall";
  if (rating >= 1500) return "SuperBall";
  return "MonsterBall";
}

// 하이퍼 이상에서만 Top5 컷 계산
export function computeTop5CutoffFromHyper(ratingsDescHyperOnly: number[]): number | undefined {
  if (!ratingsDescHyperOnly.length) return undefined;
  const top5 = ratingsDescHyperOnly.slice(0, 5);
  return top5.length < 5 ? top5[top5.length - 1] : top5[4];
}

export function ballIconPath(tier: BallTier) {
  switch (tier) {
    case "MasterBall":  return "/balls/master.webp";
    case "HyperBall":   return "/balls/hyper.webp";
    case "SuperBall":   return "/balls/super.webp";
    default:            return "/balls/monster.webp";
  }
}

// 상위 5명 컷 산출 (사용자가 이미 가져온 랭킹 배열을 넘겨주는 경우)
export function computeTop5Cutoff(ratingsDesc: number[]): number | undefined {
  if (!ratingsDesc.length) return undefined;
  const top5 = ratingsDesc.slice(0, 5);
  return top5.length < 5 ? top5[top5.length - 1] : top5[4];
}