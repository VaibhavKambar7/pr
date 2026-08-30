"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RouteLoading } from "@/features/navigation/RouteLoading";
import { getStoredAccessToken, getStoredRefreshToken } from "@/lib/auth-session";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getStoredAccessToken() || getStoredRefreshToken() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <RouteLoading
      description="Checking your local session and sending you to the right workspace."
      title="Opening Pr"
    />
  );
}
