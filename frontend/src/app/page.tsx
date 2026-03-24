"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import AnalyzeForm from "@/components/AnalyzeForm";
import Link from "next/link";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <hr className="section-rule max-w-32 mx-auto mb-8" />
          <h1 className="font-display text-5xl sm:text-7xl md:text-[5.5rem] font-bold uppercase tracking-tight leading-[0.9] mb-6">
            Your GitHub
            <br />
            <span className="font-accent italic normal-case text-[0.85em]">
              is your resume
            </span>
          </h1>
          <p className="font-body text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed mb-10">
            Get a detailed score breakdown and AI-powered suggestions to
            strengthen your GitHub presence.
          </p>
          <hr className="rule-red max-w-16 mx-auto mb-10" />
          <div className="flex justify-center">
            <AnalyzeForm />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-t border-b border-border-light py-4">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <p className="font-ui text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground text-center">
            Trusted by students at MIT &bull; Stanford &bull; Georgia Tech &bull; Carnegie Mellon &bull; UC Berkeley
          </p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 md:py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            {/* Main feature cards */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Link href="/" className="card-editorial p-6 block">
                <span className="material-symbols-outlined text-primary mb-3 block text-3xl">
                  analytics
                </span>
                <h3 className="font-display text-xl font-bold mb-2">
                  Profile Analysis
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  6-dimension scoring with AI feedback on your GitHub profile
                  strength.
                </p>
              </Link>

              <Link href="/resume" className="card-editorial p-6 block">
                <span className="material-symbols-outlined text-primary mb-3 block text-3xl">
                  description
                </span>
                <h3 className="font-display text-xl font-bold mb-2">
                  Resume Builder
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  Upload, optimize, and export ATS-friendly resumes with AI.
                </p>
              </Link>

              <Link href="/compare" className="card-editorial p-6 block">
                <span className="material-symbols-outlined text-primary mb-3 block text-3xl">
                  compare
                </span>
                <h3 className="font-display text-xl font-bold mb-2">
                  Compare Profiles
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  Head-to-head comparison of two GitHub profiles. Free &mdash; no credits.
                </p>
              </Link>

              <Link href="/cover-letter" className="card-editorial p-6 block">
                <span className="material-symbols-outlined text-primary mb-3 block text-3xl">
                  mail
                </span>
                <h3 className="font-display text-xl font-bold mb-2">
                  Cover Letter
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  AI-generated cover letters tailored to any job description.
                </p>
              </Link>
            </div>

            {/* Sidebar */}
            <aside className="md:col-span-4 border-t md:border-t-0 md:border-l border-border-light pt-6 md:pt-0 md:pl-8">
              <h4 className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-4">
                Latest Editorials
              </h4>
              <div className="space-y-4">
                <Link
                  href="/skill-gap"
                  className="block group"
                >
                  <p className="font-display text-base font-semibold group-hover:text-primary transition-colors">
                    Skill Gap Analyzer
                  </p>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">
                    Match your skills against any job posting
                  </p>
                </Link>
                <hr className="rule-thin" />
                <Link
                  href="/linkedin-optimizer"
                  className="block group"
                >
                  <p className="font-display text-base font-semibold group-hover:text-primary transition-colors">
                    LinkedIn Optimizer
                  </p>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">
                    AI-powered headline and about section optimization
                  </p>
                </Link>
                <hr className="rule-thin" />
                <Link
                  href="/pricing"
                  className="block group"
                >
                  <p className="font-display text-base font-semibold group-hover:text-primary transition-colors">
                    Premium Access
                  </p>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">
                    Unlimited access for $5/month
                  </p>
                </Link>
                <hr className="rule-thin" />
                <Link
                  href="/dashboard"
                  className="block group"
                >
                  <p className="font-display text-base font-semibold group-hover:text-primary transition-colors">
                    Your Archive
                  </p>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">
                    View all your past analyses
                  </p>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
