"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { HistoryItem } from "@/types/analysis";
import CreditsBadge from "@/components/CreditsBadge";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    api
      .getHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Your Account
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Your Archive
          </h1>
        </div>
        <CreditsBadge user={user} />
      </div>

      <hr className="section-rule mb-8" />

      {!user.is_premium && user.credits_remaining === 0 && (
        <div className="bg-primary text-white p-6 mb-8">
          <p className="font-body">
            You&apos;ve used all free analyses.{" "}
            <button
              onClick={() => router.push("/pricing")}
              className="underline underline-offset-4 font-semibold hover:no-underline"
            >
              Upgrade to Premium
            </button>{" "}
            for unlimited access.
          </p>
        </div>
      )}

      <h2 className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-6">
        Analysis History
      </h2>

      {history.length === 0 ? (
        <div className="text-center py-20 border border-border-light bg-surface">
          <p className="font-accent italic text-2xl text-muted-foreground mb-6">
            No analyses yet &mdash; start your first story
          </p>
          <button onClick={() => router.push("/")} className="btn-primary">
            <span className="material-symbols-outlined text-base">search</span>
            Analyze a Profile
          </button>
        </div>
      ) : (
        <div className="divide-y divide-border-light border-t border-b border-border-light">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 py-4 group hover:border-l-4 hover:border-l-primary hover:pl-2 transition-all duration-100"
            >
              <button
                onClick={() => router.push(`/analyze/${item.github_username}`)}
                className="flex items-center gap-4 flex-1 text-left px-4"
              >
                {item.avatar_url && (
                  <img
                    src={item.avatar_url}
                    alt={item.github_username}
                    className="w-10 h-10 border border-foreground object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-body font-semibold">{item.github_username}</p>
                  <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl font-bold tracking-tight">
                    {Math.round(item.score_overall)}
                  </p>
                  <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Score
                  </p>
                </div>
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm("Delete this analysis from your history?")) return;
                  try {
                    await api.deleteHistory(item.id);
                    setHistory((prev) => prev.filter((h) => h.id !== item.id));
                  } catch {}
                }}
                className="p-3 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-all duration-100 mr-2"
                title="Delete from history"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
