"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function BillingSuccessPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <p className="font-display text-8xl font-bold text-primary mb-6">✓</p>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-3">
          Welcome to Premium
        </h1>
        <p className="font-body text-muted-foreground mb-10 leading-relaxed">
          You now have unlimited access to every TechGenie tool. Start exploring.
        </p>
        <hr className="rule-red max-w-16 mx-auto mb-10" />
        <button onClick={() => router.push("/")} className="btn-primary">
          <span className="material-symbols-outlined text-base">search</span>
          Analyze a Profile
        </button>
      </div>
    </div>
  );
}
