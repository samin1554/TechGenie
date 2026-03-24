"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const freeFeatures = [
  "2 profile analyses",
  "2 resume generations",
  "2 cover letters",
  "Compare profiles (unlimited)",
  "Basic support",
];

const premiumFeatures = [
  "Unlimited analyses",
  "Unlimited resumes",
  "Unlimited cover letters",
  "Unlimited skill gap analyses",
  "LinkedIn Optimizer",
  "Job Board access",
  "Full analysis history",
  "Early access to new features",
];

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { checkout_url } = await api.createCheckout();
      window.location.href = checkout_url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-16">
      <div className="text-center mb-16">
        <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Pricing
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-4">
          Simple, Honest
        </h1>
        <p className="font-body text-muted-foreground text-lg">
          Start free. Upgrade when you need more.
        </p>
      </div>

      <hr className="rule-red max-w-32 mx-auto mb-16" />

      <div className="grid md:grid-cols-2 gap-0 max-w-2xl mx-auto">
        {/* Free */}
        <div className="border border-foreground p-8 md:p-10 bg-surface">
          <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-3">
            Free
          </p>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="font-display text-6xl font-bold tracking-tight">$0</span>
          </div>
          <ul className="space-y-3 mb-10">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-start gap-3 font-body text-sm">
                <span className="text-muted-foreground mt-0.5">&mdash;</span>
                {f}
              </li>
            ))}
          </ul>
          <button
            disabled
            className="w-full btn-outline opacity-50 cursor-not-allowed"
          >
            Current Plan
          </button>
        </div>

        {/* Premium */}
        <div className="border border-foreground border-l-0 p-8 md:p-10 md:-mt-4 md:-mb-4 md:py-12 bg-surface relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <div className="flex items-center justify-between mb-3">
            <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
              Premium
            </p>
            <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-ui uppercase tracking-[0.15em] font-bold">
              Recommended
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-8">
            <span className="font-display text-6xl font-bold tracking-tight">$5</span>
            <span className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">
              /month
            </span>
          </div>
          <ul className="space-y-3 mb-10">
            {premiumFeatures.map((f) => (
              <li key={f} className="flex items-start gap-3 font-body text-sm">
                <span className="text-primary mt-0.5">&mdash;</span>
                {f}
              </li>
            ))}
          </ul>
          {user?.is_premium ? (
            <button disabled className="w-full btn-outline opacity-50 cursor-default">
              Active
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading || !user}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? "Loading..." : "Upgrade Now"}
              {!loading && (
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
