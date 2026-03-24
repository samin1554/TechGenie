"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { LinkedInOptimizeResponse } from "@/types/linkedin";
import CreditsBadge from "@/components/CreditsBadge";
import UpgradeModal from "@/components/UpgradeModal";

export default function LinkedInOptimizerPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [result, setResult] = useState<LinkedInOptimizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  // Auto-fill GitHub username from user profile
  if (!githubUsername && user.github_username && !result) {
    setGithubUsername(user.github_username);
  }

  const handleOptimize = async () => {
    if (!headline.trim() || headline.trim().length < 5) {
      setError("Headline must be at least 5 characters");
      return;
    }
    if (!about.trim() || about.trim().length < 20) {
      setError("About section must be at least 20 characters");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.optimizeLinkedIn({
        headline,
        about,
        target_role: targetRole || undefined,
        github_username: githubUsername || undefined,
      });
      setResult(res);
      await refreshUser();
    } catch (err: any) {
      if (err.status === 402) {
        setShowUpgrade(true);
      } else {
        setError(err.message || "Failed to optimize LinkedIn profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (showUpgrade) {
    return <UpgradeModal open={true} onClose={() => setShowUpgrade(false)} />;
  }

  // Score gauge helpers
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
            AI Optimizer
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            LinkedIn
          </h1>
          <p className="font-body text-muted-foreground mt-2">
            Optimize your headline and about section with AI
          </p>
        </div>
        <CreditsBadge user={user} />
      </div>

      <hr className="section-rule mb-8" />

      {!result ? (
        /* ═══════════ FORM STATE ═══════════ */
        <div className="space-y-6">
          {/* Current Headline */}
          <div>
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Current Headline <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Software Engineer at Company | React Developer"
              className="w-full px-4 py-3 border border-foreground bg-surface font-body placeholder:text-muted-foreground placeholder:italic focus:border-b-2 focus:border-b-primary transition-colors duration-100"
            />
          </div>

          {/* Current About Section */}
          <div>
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Current About Section <span className="text-primary">*</span>
            </label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Paste your current LinkedIn about/summary section here..."
              rows={6}
              className="w-full px-4 py-3 border border-foreground bg-surface font-body placeholder:text-muted-foreground placeholder:italic focus:border-b-2 focus:border-b-primary transition-colors duration-100 resize-none"
            />
          </div>

          {/* Target Role */}
          <div>
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Target Role{" "}
              <span className="text-muted-foreground font-normal normal-case tracking-normal">
                (optional — tailors optimization)
              </span>
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Senior Frontend Engineer, ML Engineer"
              className="w-full px-4 py-3 border border-foreground bg-surface font-body placeholder:text-muted-foreground placeholder:italic focus:border-b-2 focus:border-b-primary transition-colors duration-100"
            />
          </div>

          {/* GitHub Username */}
          <div>
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              GitHub Username{" "}
              <span className="text-muted-foreground font-normal normal-case tracking-normal">
                (optional — enriches with project data)
              </span>
            </label>
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="e.g., torvalds"
              className="w-full px-4 py-3 border-b-2 border-foreground bg-transparent font-body placeholder:text-muted-foreground placeholder:italic focus:border-b-primary transition-colors duration-100"
            />
          </div>

          {error && (
            <div className="p-4 border border-primary bg-primary/5 font-body text-sm text-primary">
              {error}
            </div>
          )}

          <button
            onClick={handleOptimize}
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                Optimizing...
              </span>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">auto_fix_high</span>
                Optimize Profile
              </>
            )}
          </button>
        </div>
      ) : (
        /* ═══════════ RESULTS STATE ═══════════ */
        <div className="space-y-8">
          {/* Toolbar */}
          <div className="flex items-center justify-between card-editorial p-3">
            <button
              onClick={() => {
                setResult(null);
                setError(null);
              }}
              className="btn-ghost flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              New Optimization
            </button>
          </div>

          {/* Strength Score */}
          <div className="card-editorial p-8 md:p-10 text-center">
            <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-6">
              Current Profile Strength
            </p>
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="6"
                />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (result.strength_score / 100) * circumference}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-5xl font-bold tracking-tight">
                  {result.strength_score}
                </span>
                <span className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                  / 100
                </span>
              </div>
            </div>
            <p className="font-body text-sm text-muted-foreground max-w-md mx-auto">
              {result.strength_score >= 70
                ? "Your profile is strong — the optimizations below will make it even better."
                : result.strength_score >= 40
                ? "Good foundation — the optimizations below will significantly improve recruiter visibility."
                : "Significant room for improvement — apply the optimizations below for maximum impact."}
            </p>
          </div>

          {/* Before / After: Headline */}
          <div className="card-editorial p-6 md:p-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-2xl font-bold tracking-tight">
                Headline
              </h3>
              <button
                onClick={() => handleCopy(result.optimized_headline, "headline")}
                className="btn-outline py-1.5 px-3 flex items-center gap-1.5 text-xs"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                {copiedField === "headline" ? "Copied" : "Copy"}
              </button>
            </div>
            <hr className="rule-red mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                  Before
                </p>
                <p className="font-body text-muted-foreground leading-relaxed line-through decoration-primary/30">
                  {headline}
                </p>
              </div>
              <div>
                <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-primary mb-2">
                  After
                </p>
                <p className="font-body font-semibold leading-relaxed">
                  {result.optimized_headline}
                </p>
              </div>
            </div>
          </div>

          {/* Before / After: About */}
          <div className="card-editorial p-6 md:p-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-2xl font-bold tracking-tight">
                About Section
              </h3>
              <button
                onClick={() => handleCopy(result.optimized_about, "about")}
                className="btn-outline py-1.5 px-3 flex items-center gap-1.5 text-xs"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                {copiedField === "about" ? "Copied" : "Copy"}
              </button>
            </div>
            <hr className="rule-red mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                  Before
                </p>
                <div className="font-body text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {about}
                </div>
              </div>
              <div>
                <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-primary mb-2">
                  After
                </p>
                <div className="font-body text-sm leading-relaxed whitespace-pre-line">
                  {result.optimized_about}
                </div>
              </div>
            </div>
          </div>

          {/* Keywords */}
          {result.keywords.length > 0 && (
            <div className="card-editorial p-6 md:p-8">
              <h3 className="font-display text-2xl font-bold tracking-tight mb-2">
                Recommended Keywords
              </h3>
              <hr className="rule-red mb-6" />
              <p className="font-body text-sm text-muted-foreground mb-4">
                Include these keywords across your profile for maximum recruiter visibility.
              </p>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 border border-foreground font-mono-label text-xs uppercase tracking-wider"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="card-editorial p-6 md:p-8">
              <h3 className="font-display text-2xl font-bold tracking-tight mb-2">
                Additional Improvements
              </h3>
              <hr className="rule-red mb-6" />
              <ol className="space-y-4">
                {result.suggestions.map((sug, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 bg-foreground text-background flex items-center justify-center font-mono-label text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="font-body text-sm leading-relaxed pt-1">
                      {sug}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
