"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Loader2, ShieldAlert } from "lucide-react";

import { Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NazoFormModal } from "@/components/admin/nazo-form-modal";
import { CreatorFormModal } from "@/components/admin/creator-form-modal";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCreateNazoModalOpen, setIsCreateNazoModalOpen] = useState(false);
  const [isCreateCreatorModalOpen, setIsCreateCreatorModalOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !session.user.isAdmin) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        router.push("/");
      }, 2000); // Redirect after 2 seconds so user can read the error
      return () => clearTimeout(timer);
    }
  }, [session, status, router]);

  const handleCreateNazo = async (data: any) => {
    const res = await fetch("/api/nazo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Failed to create nazo");
    }

    // Optional: Refresh or redirect to the new nazo
    const newNazo = await res.json();
    router.push(`/nazo/${newNazo._id}`);
  };

  const handleCreateCreator = async (data: any) => {
    const res = await fetch("/api/creator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Failed to create creator");
    }
    // Just close modal for now, maybe add toast later
  };

  if (status === "loading" || (session?.user.isAdmin && !isRedirecting)) {
    // Show content only if loading or confirmed admin
    if (status === "loading") {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (session?.user.isAdmin) {
      return (
        <MainLayout>
          <div className="container py-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground mb-8">Welcome, Admin. Manage your Nazos here.</p>

            <div className="flex flex-col gap-4 max-w-sm">
              <Button onClick={() => setIsCreateNazoModalOpen(true)} className="w-full justify-start h-12 text-lg">
                <Plus className="mr-2 h-5 w-5" /> Create New Nazo
              </Button>
              <Button onClick={() => setIsCreateCreatorModalOpen(true)} variant="outline" className="w-full justify-start h-12 text-lg">
                <User className="mr-2 h-5 w-5" /> Create New Creator
              </Button>
            </div>

            {/* Admin features will go here */}
          </div>

          <NazoFormModal
            isOpen={isCreateNazoModalOpen}
            onClose={() => setIsCreateNazoModalOpen(false)}
            onSubmit={handleCreateNazo}
            title="Create New Nazo"
          />

          <CreatorFormModal
            isOpen={isCreateCreatorModalOpen}
            onClose={() => setIsCreateCreatorModalOpen(false)}
            onSubmit={handleCreateCreator}
            title="Create New Creator"
          />
        </MainLayout>
      );
    }
  }

  // Unauthorized State
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background gap-4 px-4 text-center">
      <ShieldAlert className="h-16 w-16 text-red-500" />
      <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
      <p className="text-muted-foreground">
        You do not have permission to access the admin area. Redirecting to home...
      </p>
    </div>
  );
}
