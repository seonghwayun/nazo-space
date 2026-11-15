"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export type AdminGuardStatus = "loading" | "admin" | "denied";

/** Returns the viewer's admin status and sends non-admins home. */
export function useAdminGuard(): AdminGuardStatus {
  const { data: session, status } = useSession();
  const router = useRouter();

  const result: AdminGuardStatus =
    status === "loading" ? "loading" : session?.user?.isAdmin ? "admin" : "denied";

  useEffect(() => {
    if (result === "denied") router.replace("/");
  }, [result, router]);

  return result;
}
