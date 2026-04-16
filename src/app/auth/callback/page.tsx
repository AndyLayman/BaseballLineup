"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // With implicit flow, Supabase appends tokens as a hash fragment.
    // The client auto-detects and sets the session. We just wait for it.
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        // Extract "next" from the URL (could be in query or hash params)
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
        const next = params.get("next") ?? hashParams.get("next") ?? "/";
        router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/");
      }
    });

    // Fallback: if no sign-in event after 5 seconds, redirect to login
    const timeout = setTimeout(() => {
      router.replace("/login?error=auth");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground animate-pulse">Signing in...</div>
    </div>
  );
}
