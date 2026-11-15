"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Loader2, ShieldAlert } from "lucide-react";

import { Plus, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TagFormModal } from "@/components/admin/tag-form-modal";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCreateTagModalOpen, setIsCreateTagModalOpen] = useState(false);

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

  const handleCreateTag = async (data: any) => {
    const res = await fetch("/api/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert(errorData.error || "Failed to create tag");
      throw new Error("Failed to create tag");
    }
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
        <MainLayout padded>
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Welcome, Admin. Manage your Nazos here.</p>
            </div>

            <div className="flex flex-col gap-4 max-w-sm">
              <Button asChild className="w-full justify-start h-12 text-lg">
                <Link href="/admin/nazo/new">
                  <Plus className="mr-2 h-5 w-5" /> Create New Nazo
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start h-12 text-lg">
                <Link href="/admin/creator/new">
                  <User className="mr-2 h-5 w-5" /> Create New Creator
                </Link>
              </Button>
              <Button onClick={() => setIsCreateTagModalOpen(true)} variant="outline" className="w-full justify-start h-12 text-lg">
                <Tag className="mr-2 h-5 w-5" /> Create New Tag
              </Button>
            </div>

            {/* Admin features will go here */}
          </div>

          <TagFormModal
            isOpen={isCreateTagModalOpen}
            onClose={() => setIsCreateTagModalOpen(false)}
            onSubmit={handleCreateTag}
            title="Create New Tag"
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
