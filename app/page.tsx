"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SIDEBAR_LAST_PAGE_KEY } from "@/components/Sidebar";

const ALLOWED_LANDING_PATHS = [
  "/dashboard",
  "/inbox",
  "/campaigns",
  "/import",
  "/schedules",
  "/sender-emails",
  "/templates",
  "/linkedin-table",
  "/search",
  "/settings",
  "/profile",
];

function safeLandingPath(stored: string | null): string {
  if (!stored) return "/dashboard";
  // Reject anything that could escape the app: protocol-relative `//host`,
  // absolute URLs, or any non-internal path.
  if (!stored.startsWith("/") || stored.startsWith("//")) return "/dashboard";
  return ALLOWED_LANDING_PATHS.some(
    (p) => stored === p || stored.startsWith(`${p}/`) || stored.startsWith(`${p}?`),
  )
    ? stored
    : "/dashboard";
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        const stored =
          typeof window !== "undefined" ? localStorage.getItem(SIDEBAR_LAST_PAGE_KEY) : null;
        router.push(safeLandingPath(stored));
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return null;
}
