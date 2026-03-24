"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface Editorial {
  date: string;
  title: string;
  byline: string;
  url: string | null;
}

const COMPANIES = [
  "Google", "Meta", "Apple", "Amazon", "Microsoft",
  "Netflix", "Stripe", "Spotify", "Airbnb", "Uber",
  "Tesla", "NVIDIA", "Shopify", "Coinbase", "Databricks",
  "Palantir", "Bloomberg", "Citadel", "Jane Street", "Two Sigma",
];

const TECH_STACKS = [
  "React", "TypeScript", "Python", "Go", "Rust",
  "Kubernetes", "AWS", "Docker", "GraphQL", "PostgreSQL",
  "Node.js", "Next.js", "TensorFlow", "PyTorch", "Redis",
  "Kafka", "Terraform", "Swift", "Kotlin", "C++",
];

export default function LoginPage() {
  const [editorials, setEditorials] = useState<Editorial[]>([]);
  const [ticker, setTicker] = useState<string[]>([]);

  useEffect(() => {
    api.getEditorials()
      .then((data) => {
        setEditorials(data.editorials);
        setTicker(data.ticker);
      })
      .catch(() => {
        // Fallback to static content on error
        setEditorials([
          { date: "Today", title: "The Open-Source Renaissance Continues to Reshape Enterprise Software", byline: "By Engineering Intelligence Desk", url: null },
          { date: "Today", title: "Why Your Contribution Graph Matters More Than Your GPA", byline: "By Senior Technical Lead", url: null },
          { date: "Today", title: "The Rise of AI-Assisted Coding: What Recruiters Actually Look For", byline: "Editorial Board", url: null },
        ]);
      });
  }, []);

  const handleGitHub = async () => {
    const { redirect_url } = await api.getGitHubRedirect();
    window.location.href = redirect_url;
  };

  const handleGoogle = async () => {
    const { redirect_url } = await api.getGoogleRedirect();
    window.location.href = redirect_url;
  };

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════
          SECTION 1: HERO
          ═══════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8 border-b border-border-light">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-brand text-6xl sm:text-8xl md:text-9xl font-black uppercase leading-[0.85] tracking-tight mb-8">
            Your GitHub Is
            <br />
            Your Resume
          </h1>
          <p className="font-accent italic text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
            AI-powered tools to analyze, optimize, and stand out in the modern
            engineering landscape.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleGitHub}
              style={{ padding: "1rem 2.5rem", fontSize: "0.8rem" }}
              className="bg-foreground text-background font-ui font-semibold uppercase tracking-[0.15em] border-2 border-foreground cursor-pointer hover:bg-transparent hover:text-foreground transition-colors duration-150"
            >
              Get Started Free
            </button>
            <Link
              href="/analyze/torvalds"
              style={{ padding: "1rem 2.5rem", fontSize: "0.8rem" }}
              className="bg-transparent text-foreground font-ui font-semibold uppercase tracking-[0.15em] border-2 border-foreground hover:bg-foreground hover:text-background transition-colors duration-150 inline-flex items-center"
            >
              See Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2: COMPANIES & TECH STACKS
          ═══════════════════════════════════════════════════════ */}
      <section className="py-6 border-b border-border-light overflow-hidden">
        <p className="font-ui text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground text-center mb-4">
          Helping engineers land roles at top companies
        </p>
        {/* Row 1: Companies — scrolling left */}
        <div className="overflow-hidden mb-3">
          <div className="showcase-scroll-left flex gap-3 whitespace-nowrap">
            {[...COMPANIES, ...COMPANIES].map((name, i) => (
              <span
                key={i}
                className="inline-block px-4 py-1.5 border border-border-light font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground hover:text-primary hover:border-primary transition-colors shrink-0"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
        {/* Row 2: Tech stacks — scrolling right */}
        <div className="overflow-hidden">
          <div className="showcase-scroll-right flex gap-3 whitespace-nowrap">
            {[...TECH_STACKS, ...TECH_STACKS].map((name, i) => (
              <span
                key={i}
                className="inline-block px-4 py-1.5 border border-foreground/20 font-mono-label text-[0.6rem] text-muted-foreground hover:text-foreground hover:border-foreground transition-colors shrink-0"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3: FEATURED TOOL + SIDEBAR
          ═══════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-16 px-4 md:px-8 border-b border-border-light">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {/* Left: Featured Tool */}
            <div className="md:col-span-7 lg:col-span-8">
              <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-primary mb-3">
                01 / Featured Tool
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight leading-[0.95] mb-4">
                GitHub Analyser
              </h2>
              <p className="font-body text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Our proprietary algorithm dissects your repository history,
                commit frequency, and code quality to generate a definitive
                &ldquo;Engineering IQ&rdquo; score. We don&apos;t just look at
                stars; we look at impact.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Animated Analysis Dashboard Preview */}
                <DashboardPreview />

                {/* Deep Intelligence card */}
                <div className="card-editorial p-6 flex flex-col justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl mb-3">
                    psychology
                  </span>
                  <h3 className="font-display text-lg font-bold mb-1">
                    Deep Intelligence
                  </h3>
                  <p className="font-ui text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
                    Benchmarked against top 1% of contributors.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Sidebar */}
            <aside className="md:col-span-5 lg:col-span-4 border-t md:border-t-0 md:border-l border-border-light pt-8 md:pt-0 md:pl-8">
              <h4 className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-foreground mb-5">
                Latest Editorials
              </h4>

              {editorials.length === 0 ? (
                // Skeleton loading state
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="mb-5 animate-pulse">
                      <div className="h-0.5 w-8 bg-primary/30 mb-2" />
                      <div className="h-3 w-12 bg-muted mb-2" />
                      <div className="h-4 w-full bg-muted mb-1" />
                      <div className="h-4 w-3/4 bg-muted mb-1" />
                      <div className="h-3 w-32 bg-muted" />
                    </div>
                  ))}
                </>
              ) : (
                editorials.slice(0, 3).map((ed, i) => (
                  <div key={i} className={i < 2 ? "mb-5" : "mb-8"}>
                    <hr className="rule-red max-w-8 mb-2" />
                    <p className="font-ui text-[0.55rem] uppercase tracking-[0.15em] text-primary mb-1">
                      {ed.date}
                    </p>
                    {ed.url ? (
                      <a href={ed.url} target="_blank" rel="noopener noreferrer" className="block group">
                        <h5 className="font-display text-base font-bold leading-snug mb-0.5 group-hover:text-primary transition-colors">
                          {ed.title}
                        </h5>
                      </a>
                    ) : (
                      <h5 className="font-display text-base font-bold leading-snug mb-0.5">
                        {ed.title}
                      </h5>
                    )}
                    <p className="font-accent italic text-xs text-muted-foreground">
                      {ed.byline}
                    </p>
                  </div>
                ))
              )}

              {/* Newsletter signup */}
              <div className="bg-foreground text-background p-5">
                <h5 className="font-brand text-lg font-bold italic mb-1">
                  Weekly Gazette
                </h5>
                <p className="font-ui text-[0.55rem] uppercase tracking-[0.15em] text-background/60 mb-3">
                  Get the best tools in your inbox.
                </p>
                <p className="font-body text-xs text-background/50 leading-relaxed mb-4">
                  Weekly curated insights on open-source trends, hiring signals,
                  and emerging frameworks — straight from our engineering desk.
                </p>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-3 py-2 bg-transparent border border-background/30 text-background font-ui text-sm placeholder:text-background/40 mb-3"
                />
                <button className="w-full py-2 bg-primary text-white font-ui text-[0.65rem] uppercase tracking-[0.15em] font-bold hover:bg-primary-dark transition-colors">
                  Subscribe
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4: THREE FEATURE CARDS
          ═══════════════════════════════════════════════════════ */}
      <section className="border-b border-border-light">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-light">
            {/* Resume Builder */}
            <div className="p-8 md:p-10">
              <span className="material-symbols-outlined text-foreground text-2xl mb-4 block">
                description
              </span>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight mb-3">
                Resume Builder
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-5">
                Convert your GitHub activity directly into a professionally
                typeset PDF that speaks the language of recruiters.
              </p>
              <button
                onClick={handleGitHub}
                className="font-ui text-[0.65rem] uppercase tracking-[0.15em] font-semibold underline underline-offset-4 hover:text-primary transition-colors"
              >
                Launch Builder
              </button>
            </div>

            {/* Cover Letter */}
            <div className="p-8 md:p-10">
              <span className="material-symbols-outlined text-foreground text-2xl mb-4 block">
                mail
              </span>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight mb-3">
                Cover Letter
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-5">
                Context-aware letter generation that references your specific
                technical achievements and project commits.
              </p>
              <button
                onClick={handleGitHub}
                className="font-ui text-[0.65rem] uppercase tracking-[0.15em] font-semibold underline underline-offset-4 hover:text-primary transition-colors"
              >
                Generate Now
              </button>
            </div>

            {/* Skill Gap */}
            <div className="p-8 md:p-10">
              <span className="material-symbols-outlined text-foreground text-2xl mb-4 block">
                insights
              </span>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight mb-3">
                Skill Gap
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-5">
                Compare your current stack with market demands. Identify exactly
                which technologies you need to master next.
              </p>
              <button
                onClick={handleGitHub}
                className="font-ui text-[0.65rem] uppercase tracking-[0.15em] font-semibold underline underline-offset-4 hover:text-primary transition-colors"
              >
                View Roadmap
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5: COMPARE WITH PEERS
          ═══════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-16 px-4 md:px-8 border-b border-border-light">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
            <div className="md:col-span-7 lg:col-span-8">
              <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight leading-[0.95] mb-4">
                Compare With Peers
              </h2>
              <p className="font-accent italic text-base text-muted-foreground mb-8">
                &ldquo;Transparency is the soul of progress.&rdquo; &mdash;
                Editorial Authority
              </p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { num: "01", title: "Commit Velocity" },
                  { num: "02", title: "Language Diversity" },
                  { num: "03", title: "Pull Request Impact" },
                ].map((metric) => (
                  <div
                    key={metric.num}
                    className="border border-foreground p-4"
                  >
                    <p className="font-ui text-[0.55rem] uppercase tracking-[0.15em] text-primary mb-2">
                      Metric {metric.num}
                    </p>
                    <h4 className="font-display text-sm md:text-base font-bold uppercase leading-tight">
                      {metric.title}
                    </h4>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 lg:col-span-4 flex flex-col items-start md:items-end gap-4">
              <span className="material-symbols-outlined text-primary text-5xl">
                compare_arrows
              </span>
              <p className="font-ui text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground leading-relaxed md:text-right max-w-xs">
                Anonymous benchmarking against regional and global peers.
                Secure, encrypted, and authoritative.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6: SIGN IN CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-md mx-auto text-center">
          <hr className="rule-red max-w-12 mx-auto mb-8" />
          <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
            Ready to Begin?
          </h2>
          <p className="font-body text-muted-foreground mb-8">
            Sign in to start analyzing your GitHub profile
          </p>

          <div className="space-y-0">
            <button
              onClick={handleGitHub}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-foreground text-background font-ui text-xs uppercase tracking-[0.15em] font-semibold border border-foreground hard-shadow-hover transition-colors duration-100 hover:bg-background hover:text-foreground"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Sign in with GitHub
            </button>

            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-surface text-foreground border border-foreground border-t-0 font-ui text-xs uppercase tracking-[0.15em] font-semibold hard-shadow-hover transition-colors duration-100 hover:bg-foreground hover:text-background"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>
          </div>

          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-6">
            New readers get 2 free profile analyses
          </p>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ANIMATED DASHBOARD PREVIEW
   ═══════════════════════════════════════════════════════ */

const BARS = [
  { label: "PRJ", pct: 82, delay: "0.3s" },
  { label: "LNG", pct: 74, delay: "0.6s" },
  { label: "CMT", pct: 91, delay: "0.9s" },
  { label: "DOC", pct: 65, delay: "1.2s" },
  { label: "COM", pct: 58, delay: "1.5s" },
  { label: "ORI", pct: 88, delay: "1.8s" },
];

function DashboardPreview() {
  const score = 87;
  const circumference = 2 * Math.PI * 28;
  const progress = (score / 100) * circumference;

  return (
    <div className="bg-foreground h-48 relative overflow-hidden select-none">
      {/* Scan line overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)",
        }}
      />

      <div className="absolute inset-0 p-4 flex gap-4">
        {/* Left: Score Gauge */}
        <div className="flex flex-col items-center justify-center w-24 shrink-0">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke="#CC0000"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                className="dash-gauge"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono-label text-lg font-bold text-white dash-score">
                {score}
              </span>
            </div>
          </div>
          <p className="font-mono-label text-[7px] uppercase tracking-widest text-white/40 mt-1.5">
            Overall
          </p>
        </div>

        {/* Right: Dimension Bars */}
        <div className="flex-1 flex flex-col justify-center gap-[6px]">
          {BARS.map((bar) => (
            <div key={bar.label} className="flex items-center gap-2">
              <span className="font-mono-label text-[7px] text-white/40 w-5 shrink-0">
                {bar.label}
              </span>
              <div className="flex-1 h-[5px] bg-white/10 overflow-hidden">
                <div
                  className="h-full dash-bar"
                  style={{
                    "--bar-width": `${bar.pct}%`,
                    animationDelay: bar.delay,
                    backgroundColor: bar.pct >= 80 ? "#CC0000" : bar.pct >= 60 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)",
                  } as React.CSSProperties}
                />
              </div>
              <span
                className="font-mono-label text-[8px] text-white/50 w-5 text-right dash-num"
                style={{ animationDelay: bar.delay }}
              >
                {bar.pct}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-primary" />
          <p className="font-mono-label text-[8px] uppercase tracking-widest text-white/40">
            Profile Analysis
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full dashboard-pulse" />
          <span className="font-mono-label text-[7px] text-green-400/70 uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>
    </div>
  );
}
