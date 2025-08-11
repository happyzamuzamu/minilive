const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const users = await prisma.user.count();
  const events = await prisma.event.count();
  const entries = await prisma.entry.count();
  const histories = await prisma.ratingHistory.count();
  console.log({ users, events, entries, histories });
  process.exit(0);
})();