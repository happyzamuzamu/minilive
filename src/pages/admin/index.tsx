import Head from "next/head";
import { ActiveEventBanner } from "@/sections/ActiveEventBanner";
import { ProfileCard } from "@/sections/ProfileCard";
import { RecentEvents } from "@/sections/RecentEvents";

export default function Home() {
  return (
    <>
      <Head>
        <title>미니라이브</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <ActiveEventBanner />
        <ProfileCard />
        <RecentEvents />
      </main>
    </>
  );
}