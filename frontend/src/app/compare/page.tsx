"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { CompareResponse } from "@/types/compare";
import CompareCard from "@/components/CompareCard";

export default function ComparePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [usernameA, setUsernameA] = useState("");
  const [usernameB, setUsernameB] = useState("");
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractUsername = (value: string): string => {
    const trimmed = value.trim();
    const match = trimmed.match(/github\.com\/([a-zA-Z0-9-]+)/);
    if (match) return match[1];
    return trimmed.replace(/^@/, "");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleCompare = async () => {
    const a = extractUsername(usernameA);
    const b = extractUsername(usernameB);
    if (!a || !b) {
      setError("Enter both usernames");
      return;
    }
    if (a.toLowerCase() === b.toLowerCase()) {
      setError("Enter two different usernames");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.compareProfiles(extractUsername(usernameA), extractUsername(usernameB));
      setResult(res);
    } catch (err: any) {
      if (err.status === 404) {
        setError("One or both GitHub users not found");
      } else if (err.status === 429) {
        setError("GitHub API rate limit — try again in a minute");
      } else {
        setError(err.message || "Comparison failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      <div className="mb-4">
        <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
          Profile Comparison
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Head-to-Head
        </h1>
        <p className="font-body text-muted-foreground mt-2">
          See how two GitHub profiles stack up side-by-side
        </p>
        <span className="inline-block mt-3 px-3 py-1 border border-foreground text-[10px] font-ui uppercase tracking-[0.15em]">
          Free &mdash; no credits required
        </span>
      </div>

      <hr className="section-rule mb-8" />

      {/* Input Form */}
      <div className="card-editorial p-6 md:p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end mb-6">
          <div>
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Player 1
            </label>
            <input
              type="text"
              value={usernameA}
              onChange={(e) => setUsernameA(e.target.value)}
              placeholder="e.g., torvalds"
              className="w-full px-4 py-3 border-b-2 border-foreground bg-transparent font-body text-lg placeholder:text-muted-foreground placeholder:italic focus:border-b-primary transition-colors duration-100"
              onKeyDown={(e) => e.key === "Enter" && handleCompare()}
            />
          </div>
          <div className="hidden md:flex items-center justify-center pb-1">
            <span className="font-display text-3xl font-bold text-primary">
              VS
            </span>
          </div>
          <div>
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Player 2
            </label>
            <input
              type="text"
              value={usernameB}
              onChange={(e) => setUsernameB(e.target.value)}
              placeholder="e.g., gaearon"
              className="w-full px-4 py-3 border-b-2 border-foreground bg-transparent font-body text-lg placeholder:text-muted-foreground placeholder:italic focus:border-b-primary transition-colors duration-100"
              onKeyDown={(e) => e.key === "Enter" && handleCompare()}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-primary bg-primary/5 font-body text-sm text-primary">
            {error}
          </div>
        )}

        <button
          onClick={handleCompare}
          disabled={loading}
          className="w-full btn-primary py-4 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
              Comparing...
            </span>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">compare_arrows</span>
              Compare Profiles
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <CompareCard
          userA={result.user_a}
          userB={result.user_b}
          winners={result.winners}
        />
      )}
    </div>
  );
}
