"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  ATSScoreResult,
  ResumeListItem,
  ResumeResult,
  ROLE_OPTIONS,
  TONE_OPTIONS,
  TEMPLATE_OPTIONS,
} from "@/types/resume";
import ATSScoreCard from "@/components/ATSScoreCard";
import CreditsBadge from "@/components/CreditsBadge";
import ResumePreview from "@/components/ResumePreview";
import UpgradeModal from "@/components/UpgradeModal";

type Step = "upload" | "scoring" | "score" | "template" | "optimize" | "generating" | "result";

const WIZARD_STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "score", label: "ATS Score" },
  { key: "template", label: "Template" },
  { key: "optimize", label: "Optimize" },
];

export default function ResumePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("upload");
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [template, setTemplate] = useState("jake");
  const [role, setRole] = useState("software_engineer");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("balanced");
  const [githubUsername, setGithubUsername] = useState("");
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<ATSScoreResult | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [editable, setEditable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.github_username) setGithubUsername(user.github_username);
    api.listResumes().then(setResumes).catch(() => {}).finally(() => setHistoryLoading(false));
  }, [authLoading, user, router]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB)");
      return;
    }
    setError(null);
    setFileName(file.name);

    try {
      const { text } = await api.parseResume(file);
      setResumeText(text);
      setStep("scoring");
      try {
        const scoreResult = await api.scoreResume(text);
        setAtsScore(scoreResult);
        setStep("score");
      } catch {
        setStep("template");
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse PDF");
      setStep("upload");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleGenerate = async () => {
    setStep("generating");
    setError(null);
    try {
      const res = await api.generateResume({
        resume_text: resumeText,
        template,
        role,
        job_description: jobDescription || undefined,
        tone,
        github_username: githubUsername || undefined,
      });
      setResult(res);
      await refreshUser();
      setStep("result");
    } catch (err: any) {
      if (err.status === 402) {
        setShowUpgrade(true);
        setStep("optimize");
      } else {
        setError(err.message || "Failed to generate resume");
        setStep("optimize");
      }
    }
  };

  const handleUpdate = async (field: string, value: any) => {
    if (!result) return;
    setSaving(true);
    try {
      const updated = await api.updateResume(result.id, { [field]: value });
      setResult(updated);
    } catch {} finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (showUpgrade) {
    return <UpgradeModal open={true} onClose={() => setShowUpgrade(false)} />;
  }

  // ===== RESULT STEP =====
  if (step === "result" && result) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="no-print flex items-center justify-between mb-6 card-editorial p-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setStep("upload"); setResult(null); setResumeText(""); setFileName(""); }}
              className="btn-ghost flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              New Resume
            </button>
            <span className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {result.header.name}
            </span>
            {saving && (
              <span className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Saving...
              </span>
            )}
          </div>
          <div className="flex items-center gap-0">
            <button
              onClick={() => setEditable(!editable)}
              className={`px-4 py-2 font-ui text-xs uppercase tracking-[0.15em] border border-foreground transition-colors duration-100 ${
                editable
                  ? "bg-primary text-white border-primary"
                  : "hover:bg-muted"
              }`}
            >
              {editable ? "Done" : "Edit"}
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
        <ResumePreview resume={result} editable={editable} onUpdate={handleUpdate} />
      </div>
    );
  }

  // ===== GENERATING STEP =====
  if (step === "generating") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin mx-auto mb-8" />
          <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
            Optimizing your resume...
          </h2>
          <p className="font-body text-muted-foreground">
            AI is analyzing and improving your resume for maximum impact
          </p>
          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-2">
            This takes 10-20 seconds
          </p>
        </div>
      </div>
    );
  }

  // ===== WIZARD STEPS =====
  const currentIdx = WIZARD_STEPS.findIndex(
    (ws) => ws.key === step || (step === "scoring" && ws.key === "score")
  );

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Resume Builder
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Resume
          </h1>
          <p className="font-body text-muted-foreground mt-2">
            Upload, optimize, and export your resume
          </p>
        </div>
        <CreditsBadge user={user} />
      </div>

      <hr className="section-rule mb-8" />

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {WIZARD_STEPS.map((ws, i) => (
          <div key={ws.key} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 border border-foreground font-ui text-xs uppercase tracking-[0.15em] ${
              i > 0 ? "-ml-px" : ""
            } ${
              currentIdx === i
                ? "bg-primary text-white border-primary"
                : currentIdx > i
                ? "bg-muted text-foreground"
                : "text-muted-foreground"
            }`}>
              <span className="font-mono-label font-bold">
                {currentIdx > i ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{ws.label}</span>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 border border-primary bg-primary/5 font-body text-sm text-primary">
          {error}
        </div>
      )}

      {/* ===== STEP 1: UPLOAD ===== */}
      {step === "upload" && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
            className={`border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-150 hard-shadow-hover ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border-light hover:border-primary"
            }`}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <span className="material-symbols-outlined text-4xl text-muted-foreground mb-4 block">upload_file</span>
            <p className="font-display text-xl font-bold mb-1">Drop your resume here</p>
            <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              or click to browse &middot; PDF only &middot; Max 10MB
            </p>
            {fileName && (
              <p className="mt-4 font-mono-label text-sm font-semibold">{fileName}</p>
            )}
          </div>

          {/* Previous resumes */}
          {!historyLoading && resumes.length > 0 && (
            <div className="mt-12">
              <h2 className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-6">
                Previous Resumes
              </h2>
              <div className="divide-y divide-border-light border-t border-b border-border-light">
                {resumes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 py-4 group hover:border-l-4 hover:border-l-primary hover:pl-2 transition-all duration-100"
                  >
                    <button
                      onClick={async () => {
                        const res = await api.getResume(item.id);
                        setResult(res);
                        setStep("result");
                      }}
                      className="flex items-center gap-4 flex-1 text-left px-4"
                    >
                      <div className="w-10 h-10 bg-primary text-white flex items-center justify-center font-display font-bold text-lg">
                        {item.header_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-body font-semibold">{item.header_name}</p>
                        <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                          {item.template === "jake" ? "Jake's Template" : "SWE Default"} &middot;{" "}
                          {new Date(item.created_at).toLocaleDateString()}
                          {item.is_edited && (
                            <span className="ml-2 px-2 py-0.5 bg-primary text-white text-[9px]">
                              edited
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this resume?")) return;
                        try {
                          await api.deleteResume(item.id);
                          setResumes((prev) => prev.filter((r) => r.id !== item.id));
                        } catch {}
                      }}
                      className="p-3 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-all duration-100 mr-2"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== STEP: SCORING (loading) ===== */}
      {step === "scoring" && (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin mx-auto mb-8" />
          <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
            Analyzing your resume...
          </h2>
          <p className="font-body text-muted-foreground">
            Evaluating ATS compatibility and content quality
          </p>
        </div>
      )}

      {/* ===== STEP: ATS SCORE ===== */}
      {step === "score" && atsScore && (
        <ATSScoreCard score={atsScore} onContinue={() => setStep("template")} />
      )}

      {/* ===== STEP 2: TEMPLATE ===== */}
      {step === "template" && (
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight mb-6">
            Choose a Template
          </h2>
          <div className="grid grid-cols-2 gap-0 mb-10">
            {TEMPLATE_OPTIONS.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => setTemplate(opt.value)}
                className={`p-6 border border-foreground text-left transition-all duration-150 ${
                  i > 0 ? "-ml-px" : ""
                } ${
                  template === opt.value
                    ? "bg-primary text-white border-primary"
                    : "hover:bg-muted card-editorial"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-16 border flex items-center justify-center font-mono-label text-xs ${
                    template === opt.value
                      ? "border-white/50 text-white"
                      : "border-foreground text-foreground"
                  }`}>
                    {opt.value === "jake" ? "LaTeX" : "SWE"}
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg">{opt.label}</p>
                    <p className={`font-body text-sm mt-1 ${
                      template === opt.value ? "text-white/70" : "text-muted-foreground"
                    }`}>
                      {opt.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep("upload")} className="btn-outline flex items-center gap-2">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back
            </button>
            <button onClick={() => setStep("optimize")} className="btn-primary flex items-center gap-2">
              Next
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 3: OPTIMIZE ===== */}
      {step === "optimize" && (
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight mb-8">
            Content Optimization
          </h2>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Target Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-foreground bg-surface font-body focus:border-b-2 focus:border-b-primary transition-colors duration-100 appearance-none cursor-pointer"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Job Description */}
          <div className="mb-6">
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Job Description{" "}
              <span className="text-muted-foreground font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to tailor your resume..."
              rows={4}
              className="w-full px-4 py-3 border border-foreground bg-surface font-body placeholder:text-muted-foreground placeholder:italic focus:border-b-2 focus:border-b-primary transition-colors duration-100 resize-none"
            />
            <p className="font-ui text-[10px] text-muted-foreground mt-1">
              AI will match your resume keywords and experience to this JD
            </p>
          </div>

          {/* Tone */}
          <div className="mb-6">
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              Level of Detail
            </label>
            <div className="grid grid-cols-3 gap-0">
              {TONE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => setTone(opt.value)}
                  className={`p-4 border border-foreground text-left transition-colors duration-100 ${
                    i > 0 ? "-ml-px" : ""
                  } ${
                    tone === opt.value
                      ? "bg-primary text-white border-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <p className="font-body font-semibold text-sm">{opt.label}</p>
                  <p className={`font-body text-xs mt-1 ${
                    tone === opt.value ? "text-white/70" : "text-muted-foreground"
                  }`}>{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* GitHub Username */}
          <div className="mb-10">
            <label className="block font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
              GitHub Username{" "}
              <span className="text-muted-foreground font-normal normal-case tracking-normal">
                (optional — enhances skills & projects)
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

          <div className="flex justify-between">
            <button onClick={() => setStep("template")} className="btn-outline flex items-center gap-2">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back
            </button>
            <button onClick={handleGenerate} className="btn-primary flex items-center gap-2 px-8">
              Generate Resume
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
