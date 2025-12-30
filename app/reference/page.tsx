import { MainLayout } from "@/components/layout/main-layout";

export default function ReferencePage() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h1 className="text-2xl font-bold">참고</h1>
        <p className="text-muted-foreground mt-2">Reference materials will be here.</p>
      </div>
    </MainLayout>
  );
}
