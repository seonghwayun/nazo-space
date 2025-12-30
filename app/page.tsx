import { MainLayout } from "@/components/layout/main-layout";

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Welcome to Nazo Space
        </h1>
        <p className="max-w-[700px] mt-4 text-lg text-muted-foreground sm:text-xl">
          Your space for mysteries and puzzles.
        </p>
      </div>
    </MainLayout>
  );
}
