"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RouteLoading } from "../features/navigation/RouteLoading";
import { getStoredAccessToken } from "../lib/auth-session";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getStoredAccessToken() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <RouteLoading
      description="Checking your local session and sending you to the right workspace."
      title="Opening Promptu"
    />
  );
}
