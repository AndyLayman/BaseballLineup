"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next") ?? "/";
    const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          router.replace("/login?error=auth");
        } else {
          router.replace(next);
        }
      });
    } else {
      router.replace("/login?error=auth");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground animate-pulse">Signing in...</div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Signing in...</div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
