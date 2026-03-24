"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { AnalysisResult } from "@/types/analysis";
import ScoreCard from "@/components/ScoreCard";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import InsightPanel from "@/components/InsightPanel";
import ShareButton from "@/components/ShareButton";
import LoadingState from "@/components/LoadingState";
import UpgradeModal from "@/components/UpgradeModal";

export default function AnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);

  const username = params.username as string;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (fetched.current) return;
    fetched.current = true;

    (async () => {
      try {
        const result = await api.analyze(username);
        setData(result);
        await refreshUser();
      } catch (err: any) {
        if (err.status === 402) {
          setShowUpgrade(true);
        } else if (err.status === 404) {
          setError("GitHub user not found");
        } else if (err.status === 429) {
          setError("GitHub API rate limit exceeded. Please try again later.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, username, router, refreshUser]);

  if (authLoading || loading) return <LoadingState />;

  if (showUpgrade) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <UpgradeModal open={true} onClose={() => router.push("/")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <p className="font-display text-2xl font-bold mb-2">{error}</p>
        <p className="font-body text-muted-foreground mb-8">
          Please check the username and try again.
        </p>
        <button onClick={() => router.push("/")} className="btn-outline">
          Go Back
        </button>
      </div>
    );
  }

  if (!data) return null;

  const analysisDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
      {/* Byline */}
      <div className="mb-8">
        <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
          Profile Analysis &middot; {analysisDate} &middot; @{data.github_username}
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          {data.github_username}
        </h1>
      </div>

      <hr className="section-rule mb-12" />

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left: Score Card */}
        <div className="flex flex-col items-center gap-4">
          <ScoreCard ref={cardRef} data={data} />
          <ShareButton cardRef={cardRef} username={username} />
        </div>

        {/* Right: Details */}
        <div className="flex-1 space-y-10">
          <ScoreBreakdown scores={data.scores} />

          <hr className="section-rule" />

          <InsightPanel feedback={data.llm_feedback} suggestions={data.suggestions} />

          {/* Resume CTA */}
          <div className="bg-primary text-white p-6">
            <h3 className="font-display text-xl font-bold tracking-tight mb-2">
              Generate a Resume
            </h3>
            <p className="font-body text-sm text-white/80 mb-4">
              Turn this GitHub profile into a professional, ATS-friendly resume
            </p>
            <button
              onClick={() => router.push(`/resume/${username}`)}
              className="px-6 py-3 bg-white text-primary font-ui text-xs uppercase tracking-[0.15em] font-semibold hover:bg-foreground hover:text-white border border-white transition-colors duration-100 flex items-center gap-2"
            >
              Generate Resume
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>

          <hr className="section-rule" />

          {/* Top Repos */}
          {data.top_repos && data.top_repos.length > 0 && (
            <div>
              <h3 className="font-display text-2xl font-bold tracking-tight mb-4">
                Top Repositories
              </h3>
              <hr className="rule-red mb-6" />
              <div className="divide-y divide-border-light">
                {data.top_repos.map((repo) => (
                  <div
                    key={repo.name}
                    className="flex items-center justify-between py-4 group"
                  >
                    <div>
                      <p className="font-body font-semibold group-hover:text-primary transition-colors">
                        {repo.name}
                      </p>
                      {repo.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1 font-body">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm font-mono-label text-muted-foreground">
                      {repo.language && (
                        <span className="text-xs uppercase tracking-wider">
                          {repo.language}
                        </span>
                      )}
                      <span>{repo.stars} ★</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
