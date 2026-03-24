"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import CreditsBadge from "@/components/CreditsBadge";
import UpgradeModal from "@/components/UpgradeModal";

export default function CoverLetterPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const letterRef = useRef<HTMLDivElement>(null);

  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError("Job description is required");
      return;
    }

    setLoading(true);
    setError(null);
    setCoverLetter(null);

    try {
      const res = await api.generateCoverLetter({
        job_description: jobDescription,
        resume_text: resumeText || undefined,
        github_username: githubUsername || undefined,
      });
      setCoverLetter(res.cover_letter);
      await refreshUser();
    } catch (err: any) {
      if (err.status === 402) {
        setShowUpgrade(true);
      } else {
        setError(err.message || "Failed to generate cover letter");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!coverLetter) return;
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showUpgrade) {
    return <UpgradeModal open={true} onClose={() => setShowUpgrade(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
            AI Writer
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Cover Letter
          </h1>
          <p className="font-body text-muted-foreground mt-2">
            AI-tailored cover letters for any job posting
          </p>
        </div>
        <CreditsBadge user={user} />
      </div>

      <hr className="section-rule mb-8" />

      {!coverLetter ? (
        <div className="space-y-6">
          {/* Job Description */}
          <div>
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Job Description <span className="text-primary">*</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={8}
              className="w-full px-4 py-3 border border-foreground bg-surface font-body placeholder:text-muted-foreground placeholder:italic focus:border-b-2 focus:border-b-primary transition-colors duration-100 resize-none"
            />
          </div>

          {/* Resume Text */}
          <div>
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Your Resume Text{" "}
              <span className="text-muted-foreground font-normal normal-case tracking-normal">
                (optional — improves quality)
              </span>
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              rows={4}
              className="w-full px-4 py-3 border border-foreground bg-surface font-body placeholder:text-muted-foreground placeholder:italic focus:border-b-2 focus:border-b-primary transition-colors duration-100 resize-none"
            />
          </div>

          {/* GitHub Username */}
          <div>
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              GitHub Username{" "}
              <span className="text-muted-foreground font-normal normal-case tracking-normal">
                (optional — references your projects)
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
            onClick={handleGenerate}
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                Generating...
              </span>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">edit_note</span>
                Generate Cover Letter
              </>
            )}
          </button>
        </div>
      ) : (
        <div>
          {/* Toolbar */}
          <div className="no-print flex items-center justify-between mb-6 card-editorial p-3">
            <button
              onClick={() => {
                setCoverLetter(null);
                setError(null);
              }}
              className="btn-ghost flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              New Letter
            </button>
            <div className="flex items-center gap-0">
              <button onClick={handleCopy} className="btn-outline py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">content_copy</span>
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary py-2 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Export PDF
              </button>
            </div>
          </div>

          {/* Cover Letter Display */}
          <div
            ref={letterRef}
            className="bg-surface border border-foreground mx-auto p-8 md:p-12"
            style={{
              maxWidth: "8.5in",
              fontFamily: "var(--font-body), Georgia, serif",
              fontSize: "11pt",
              lineHeight: "1.7",
            }}
          >
            <div className="border-b-4 border-primary pb-4 mb-8">
              <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                AI-Generated Cover Letter
              </p>
            </div>
            {coverLetter.split("\n\n").map((paragraph, i) => (
              <p key={i} className="mb-5 font-body">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          div[style*="max-width: 8.5in"],
          div[style*="max-width: 8.5in"] * {
            visibility: visible;
          }
          div[style*="max-width: 8.5in"] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0.75in 1in;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
