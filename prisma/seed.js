const { PrismaClient, EventState } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: "demo-user" },
    update: {},
    create: { id: "demo-user", nickname: "데모", password: null },
  });

  await prisma.user.upsert({
    where: { id: "user-2" },
    update: {},
    create: { id: "user-2", nickname: "상대", password: null },
  });

  const eventId = "running-0811";
  await prisma.event.upsert({
    where: { id: eventId },
    update: {},
    create: {
      id: eventId,
      name: "테스트 러닝 이벤트",
      date: new Date(),
      rounds: 5,
      bestOf: 1,
      format: "SWISS",
      state: EventState.DRAFT,
      roundLengthSec: 3000,
      roundStartedAt: null,
    },
  });

  await prisma.entry.upsert({
    where: { userId_eventId: { userId: "demo-user", eventId } },
    update: {},
    create: { userId: "demo-user", eventId },
  });

  await prisma.entry.upsert({
    where: { userId_eventId: { userId: "user-2", eventId } },
    update: {},
    create: { userId: "user-2", eventId },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });