import { HomeClient } from "@/components/home/home-client";
import { getHomeData } from "@/lib/home-data";

// Rebuilt at most once a minute, like the /api/home cache.
export const revalidate = 60;

export default async function Home() {
  // The lists go into the server HTML, so crawlers find the nazo pages from the home page.
  // If the database is unreachable the client loads them itself, as it used to.
  const initialData = await getHomeData().catch((error) => {
    console.error("Failed to load home data on the server:", error);
    return null;
  });
  return <HomeClient initialData={initialData} />;
}
