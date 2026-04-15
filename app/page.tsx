"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SIDEBAR_LAST_PAGE_KEY } from "@/components/Sidebar";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        const lastPage = localStorage.getItem(SIDEBAR_LAST_PAGE_KEY) || "/dashboard";
        router.push(lastPage);
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return null;
}
