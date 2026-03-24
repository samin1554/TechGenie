"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      router.push("/login");
      return;
    }

    (async () => {
      try {
        const iss = searchParams.get("iss");
        const scope = searchParams.get("scope");
        const isGoogle = iss?.includes("google") || scope?.includes("openid");

        if (isGoogle) {
          await api.googleCallback(code, state);
        } else {
          await api.githubCallback(code, state);
        }
        await refreshUser();
        router.push("/");
      } catch {
        router.push("/login");
      }
    })();
  }, [searchParams, router, refreshUser]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin mx-auto mb-6" />
        <p className="font-accent italic text-muted-foreground">
          Authenticating...
        </p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
