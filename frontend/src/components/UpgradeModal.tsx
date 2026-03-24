"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

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
    <div className="fixed inset-0 bg-foreground/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-foreground max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors duration-100"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Credits Exhausted
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight mb-3">
          Upgrade to Premium
        </h2>
        <p className="font-body text-muted-foreground mb-8 leading-relaxed">
          You&apos;ve used all 2 free analyses. Unlock unlimited access to every
          TechGenie tool.
        </p>

        <div className="bg-foreground text-background p-6 mb-8">
          <div className="flex items-baseline gap-1 mb-4">
            <span className="font-display text-5xl font-bold tracking-tight">$5</span>
            <span className="font-mono-label text-xs uppercase tracking-widest text-background/50">
              /month
            </span>
          </div>
          <ul className="space-y-2 font-body text-sm text-background/80">
            <li>&mdash; Unlimited GitHub analyses</li>
            <li>&mdash; Unlimited resume generations</li>
            <li>&mdash; Unlimited cover letters</li>
            <li>&mdash; Unlimited skill gap analyses</li>
            <li>&mdash; Full analysis history</li>
          </ul>
        </div>

        <div className="flex gap-0">
          <button
            onClick={onClose}
            className="flex-1 btn-outline py-3"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
          >
            {loading ? "Loading..." : "Upgrade Now"}
            {!loading && <span className="material-symbols-outlined text-base">arrow_forward</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
