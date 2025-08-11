import { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";

export default function Home(props: any) {
  const { upcoming, ended } = props;
  return (
    <main style={{ padding: 20 }}>
      <h1>MiniLive</h1>
      <h2>Upcoming</h2>
      <ul>
        {upcoming.map((e: any) => (
          <li key={e.id}>{e.name}</li>
        ))}
      </ul>
      <h2>Recent</h2>
      <ul>
        {ended.map((e: any) => (
          <li key={e.id}>{e.event.name}</li>
        ))}
      </ul>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const USER_ID = "demo-user";
  const upcoming = await prisma.event.findMany({
    where: { state: "RUNNING" },
    orderBy: { date: "asc" },
    take: 8,
  });
  const ended = await prisma.entry.findMany({
    where: { userId: USER_ID, event: { state: "ENDED" } },
    include: { event: true },
    orderBy: { event: { date: "desc" } },
    take: 8,
  });
  return { props: { upcoming, ended } };
};