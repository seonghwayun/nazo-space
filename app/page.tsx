export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center gap-8 row-start-2 sm:items-start">
        <h1 className="text-4xl font-bold">Welcome to Nazo Space</h1>
        <p className="text-lg text-muted-foreground">
          Your space for mysteries and puzzles.
        </p>
      </main>
    </div>
  );
}
