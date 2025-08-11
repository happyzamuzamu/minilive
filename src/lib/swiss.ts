import { prisma } from "@/lib/prisma";

type Pair = { p1Id: number; p2Id: number | null };
type BuildResult = { roundId: number; pairs: Pair[]; tables: { matchId: number; tableNo: number }[] };

async function getEntriesSorted(eventId: string) {
  const entries = await prisma.entry.findMany({
    where: { eventId },
    orderBy: [{ wins: "desc" }, { losses: "asc" }, { id: "asc" }],
  });
  return entries;
}

async function getPlayedPairsMap(eventId: string) {
  const matches = await prisma.match.findMany({
    where: { eventId, reported: true },
    select: { p1Id: true, p2Id: true },
  });
  const set = new Set<string>();
  for (const m of matches) {
    if (m.p1Id != null && m.p2Id != null) {
      const a = Math.min(m.p1Id, m.p2Id);
      const b = Math.max(m.p1Id, m.p2Id);
      set.add(`${a}-${b}`);
    }
  }
  return set;
}

function canPair(a: number, b: number, played: Set<string>) {
  if (a == null || b == null) return true;
  const x = Math.min(a, b);
  const y = Math.max(a, b);
  return !played.has(`${x}-${y}`);
}

function greedySwissPair(entryIds: number[], played: Set<string>) {
  const used = new Set<number>();
  const pairs: Pair[] = [];
  for (let i = 0; i < entryIds.length; i++) {
    const a = entryIds[i];
    if (used.has(a)) continue;
    let paired = false;
    for (let j = i + 1; j < entryIds.length; j++) {
      const b = entryIds[j];
      if (used.has(b)) continue;
      if (canPair(a, b, played)) {
        pairs.push({ p1Id: a, p2Id: b });
        used.add(a);
        used.add(b);
        paired = true;
        break;
      }
    }
    if (!paired) {
      pairs.push({ p1Id: a, p2Id: null });
      used.add(a);
    }
  }
  return pairs;
}

export async function swissBuildRound(eventId: string, bestOf: number): Promise<BuildResult> {
  const entries = await getEntriesSorted(eventId);
  const entryIds = entries.map((e) => e.id);
  const played = await getPlayedPairsMap(eventId);
  const pairs = greedySwissPair(entryIds, played);
  const last = await prisma.round.findFirst({
    where: { eventId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const nextNumber = (last?.number ?? 0) + 1;
  const round = await prisma.round.create({ data: { eventId, number: nextNumber } });
  const created = await prisma.$transaction(
    pairs.map((p, idx) =>
      prisma.match.create({
        data: {
          eventId,
          roundId: round.id,
          tableNo: idx + 1,
          p1Id: p.p1Id ?? null,
          p2Id: p.p2Id ?? null,
          reported: false,
        },
      })
    )
  );
  const tables = created.map((m) => ({ matchId: m.id, tableNo: m.tableNo ?? 0 }));
  return { roundId: round.id, pairs, tables };
}