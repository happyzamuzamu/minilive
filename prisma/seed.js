const { PrismaClient, EventState } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const eventId = "running-0811";

  const user = await prisma.user.upsert({
    where: { id: "demo-user" },
    update: {},
    create: {
      id: "demo-user",
      nickname: "데모유저",
      password: null,
      rating: 1500,
      games: 0,
    },
  });

  await prisma.event.upsert({
    where: { id: eventId },
    update: {},
    create: {
      id: eventId,
      name: "테스트 러닝 이벤트",
      date: new Date(),
      roundsCount: 5,
      bestOf: 1,
      format: "SWISS",
      state: EventState.DRAFT,
      roundLengthSec: 3000,
      roundStartedAt: null,
    },
  });

  await prisma.entry.upsert({
    where: { userId_eventId: { userId: user.id, eventId } },
    update: {},
    create: { userId: user.id, eventId },
  });

  await prisma.round.upsert({
    where: { eventId_number: { eventId, number: 1 } },
    update: {},
    create: { eventId, number: 1, startedAt: null },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed FAILED:", e);
    await prisma.$disconnect();
    process.exit(1);
  });