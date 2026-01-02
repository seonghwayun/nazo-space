"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import Image from "next/image";

export default function MyPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!session) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-6">
          <h1 className="text-2xl font-bold">Welcome to Nazo Space</h1>
          <p className="text-muted-foreground text-center max-w-xs">
            Sign in to track your progress and manage your creations.
          </p>
          <Button onClick={() => signIn("google")} className="w-full max-w-sm">
            Sign in with Google
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border shadow-sm">
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl font-bold">
                {session.user?.name?.[0] || "U"}
              </span>
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-xl font-bold">{session.user?.name}</h2>
            <p className="text-muted-foreground text-sm">{session.user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Future My Page Content */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold mb-2">My Nazos</h3>
            <p className="text-sm text-muted-foreground">You haven't solved any nazos yet.</p>
          </div>
        </div>

        <Button variant="outline" onClick={() => signOut()} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </MainLayout>
  );
}
