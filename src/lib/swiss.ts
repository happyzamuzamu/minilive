import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/** 이 이벤트에서 두 유저가 과거에 맞붙었는지 */
export async function alreadyPlayed(eventId: string, a: string, b: string) {
  if (a === b) return true;
  const count = await prisma.match.count({
    where: {
      eventId,
      OR: [
        { p1Id: a, p2Id: b },
        { p1Id: b, p2Id: a },
      ],
    },
  });
  return count > 0;
}

/** 부전승(BYE) 매치 생성: p2 없음, 즉시 보고처리 + 승자 = playerId */
export async function createByeMatch(
  eventId: string,
  roundId: number,
  playerId: string,
  tableNo: number
) {
  await prisma.match.create({
    data: {
      eventId,
      roundId,
      tableNo,
      p1Id: playerId,
      reported: true,
      winnerId: playerId,
    },
  });
}

export type PairingResult = {
  pairs: Array<[string, string] | [string]>;
  tables: number;
};

/** 엔트리 wins 기준 스위스 한 번 생성(간단판) */
export async function swissPairingOnce(eventId: string, roundId: number): Promise<PairingResult> {
  const entries = await prisma.entry.findMany({
    where: { eventId },
    select: { userId: true, wins: true, losses: true },
    orderBy: [{ wins: "desc" }, { losses: "asc" }],
  });

  // 점수 버킷
  const buckets = new Map<number, string[]>();
  for (const e of entries) {
    const arr = buckets.get(e.wins) || [];
    arr.push(e.userId);
    buckets.set(e.wins, arr);
  }

  const pairs: Array<[string, string] | [string]> = [];
  const used = new Set<string>();
  const scores = Array.from(buckets.keys()).sort((a, b) => b - a);

  for (const sc of scores) {
    const group = (buckets.get(sc) || []).filter((u) => !used.has(u));

    // 셔플
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }

    while (group.length) {
      const a = group.shift()!;
      if (!group.length) {
        // 홀수면 아래 점수대에서 당겨오기
        let b: string | undefined;
        for (const s2 of scores.slice(scores.indexOf(sc) + 1)) {
          const lower = (buckets.get(s2) || []).filter((u) => !used.has(u));
          if (lower.length) {
            b = lower.shift()!;
            buckets.set(s2, lower);
            break;
          }
        }
        if (b) {
          used.add(a); used.add(b);
          pairs.push([a, b]);
        } else {
          // 정말 없으면 BYE
          pairs.push([a]);
          used.add(a);
        }
      } else {
        // 재대진 회피 시도
        let partnerIdx = -1;
        for (let i = 0; i < group.length; i++) {
          const cand = group[i];
          // eslint-disable-next-line no-await-in-loop
          const clash = await alreadyPlayed(eventId, a, cand);
          if (!clash) { partnerIdx = i; break; }
        }
        if (partnerIdx === -1) partnerIdx = 0; // 불가피하면 허용
        const b = group.splice(partnerIdx, 1)[0];
        used.add(a); used.add(b);
        pairs.push([a, b]);
      }
    }
  }

  // 매치 생성
  let table = 1;
  for (const p of pairs) {
    if (p.length === 1) {
      await createByeMatch(eventId, roundId, p[0], table++);
    } else {
      const [p1, p2] = p as [string, string];
      await prisma.match.create({
        data: { eventId, roundId, tableNo: table++, p1Id: p1, p2Id: p2, reported: false },
      });
    }
  }

  return { pairs, tables: table - 1 };
}