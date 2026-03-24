"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { SkillGapResponse } from "@/types/skill-gap";
import CreditsBadge from "@/components/CreditsBadge";
import SkillGapResults from "@/components/SkillGapResults";
import UpgradeModal from "@/components/UpgradeModal";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function SkillGapPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [jobDescription, setJobDescription] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState<SkillGapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError("Job description is required");
      return;
    }
    if (!githubUsername.trim() && !resumeText.trim()) {
      setError("Provide at least a GitHub username or resume text");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.analyzeSkillGap({
        job_description: jobDescription,
        github_username: githubUsername || undefined,
        resume_text: resumeText || undefined,
      });
      setResult(res);
      await refreshUser();
    } catch (err: any) {
      if (err.status === 402) {
        setShowUpgrade(true);
      } else {
        setError(err.message || "Failed to analyze skill gap");
      }
    } finally {
      setLoading(false);
    }
  };

  if (showUpgrade) {
    return <UpgradeModal open={true} onClose={() => setShowUpgrade(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12 py-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Career Intelligence
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Skill Gap
          </h1>
          <p className="font-body text-muted-foreground mt-2">
            See how your skills match up against any job posting
          </p>
        </div>
        <CreditsBadge user={user} />
      </div>

      <hr className="rule-thick mb-8" />

      {!result ? (
        <div className="space-y-6">
          {/* Job Description */}
          <div>
            <label className="block font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Job Description <span className="text-foreground">*</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={8}
              className="w-full px-4 py-3 border-2 border-foreground bg-transparent font-body placeholder:text-muted-foreground placeholder:italic focus:bg-muted transition-colors duration-100 resize-none"
            />
          </div>

          {/* GitHub Username */}
          <div>
            <label className="block font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              GitHub Username{" "}
              <span className="text-muted-foreground font-normal normal-case tracking-normal">
                (provide this and/or resume text)
              </span>
            </label>
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="e.g., torvalds"
              className="w-full px-4 py-3 border-b-2 border-foreground bg-transparent font-body placeholder:text-muted-foreground placeholder:italic focus:bg-muted transition-colors duration-100"
            />
          </div>

          {/* Resume Text */}
          <div>
            <label className="block font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Resume Text{" "}
              <span className="text-muted-foreground font-normal normal-case tracking-normal">
                (provide this and/or GitHub username)
              </span>
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-foreground bg-transparent font-body placeholder:text-muted-foreground placeholder:italic focus:bg-muted transition-colors duration-100 resize-none"
            />
          </div>

          {error && (
            <div className="p-4 border-2 border-foreground bg-muted font-body text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full px-6 py-4 bg-foreground text-background text-xs font-medium uppercase tracking-widest hover:bg-background hover:text-foreground border-2 border-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-background border-t-transparent animate-spin" />
                Analyzing...
              </span>
            ) : (
              <>
                Analyze Skill Gap
                <ArrowRight size={14} strokeWidth={1.5} />
              </>
            )}
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => {
              setResult(null);
              setError(null);
            }}
            className="flex items-center gap-2 mb-8 px-4 py-2 border-2 border-foreground text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors duration-100"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            New Analysis
          </button>
          <SkillGapResults result={result} />
        </div>
      )}
    </div>
  );
}
