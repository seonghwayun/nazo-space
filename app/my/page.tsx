import { MainLayout } from "@/components/layout/main-layout";

export default function MyPage() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h1 className="text-2xl font-bold">MY</h1>
        <p className="text-muted-foreground mt-2">Personal profile and settings.</p>
      </div>
    </MainLayout>
  );
}
