import { BracketsManager } from "brackets-manager";
import { InMemoryDatabase } from "brackets-memory-db";

export type Store = {
  db: InMemoryDatabase;
  manager: BracketsManager;
  tournamentId?: number;
};

const stores = new Map<string, Store>();

export function getBracketStore(eventId: string): Store {
  let s = stores.get(eventId);
  if (!s) {
    const db = new InMemoryDatabase();
    const manager = new BracketsManager(db);
    s = { db, manager, tournamentId: undefined };
    stores.set(eventId, s);
  }
  return s;
}

async function safeSelect(db: any, table: string) {
  try {
    const rows = await db.select(table);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export async function exportViewerData(eventId: string) {
  const { db } = getBracketStore(eventId);
  const _db: any = db as any;
  const tournaments = await safeSelect(_db, "tournament");
  const stages = await safeSelect(_db, "stage");
  const groups = await safeSelect(_db, "group");
  const rounds = await safeSelect(_db, "round");
  const matches = await safeSelect(_db, "match");
  const matchGames = await safeSelect(_db, "match_game");
  const participants = await safeSelect(_db, "participant");
  return { tournaments, stages, groups, rounds, matches, matchGames, participants };
}