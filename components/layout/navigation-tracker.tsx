"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { navigationTracker } from "@/lib/form-routes";

/** Records client-side navigations so `goBackOr` knows whether `back()` stays in the app. */
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) navigationTracker.onPathname(pathname);
  }, [pathname]);
  return null;
}
