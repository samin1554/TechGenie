"use client";

import { ATSScoreResult } from "@/types/resume";

interface ATSScoreCardProps {
  score: ATSScoreResult;
  onContinue: () => void;
}

export default function ATSScoreCard({ score, onContinue }: ATSScoreCardProps) {
  const circumference = 2 * Math.PI * 54;
  const progress = (score.overall / 100) * circumference;

  return (
    <div className="space-y-8">
      {/* Overall Score */}
      <div className="card-editorial p-8 md:p-10 text-center">
        <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-6">
          Your ATS Score
        </p>
        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--muted)"
              strokeWidth="6"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl font-bold tracking-tight">
              {score.overall}
            </span>
            <span className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
              / 100
            </span>
          </div>
        </div>
        <p className="font-body text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          {score.summary}
        </p>
      </div>

      {/* Category Breakdown */}
      <div className="card-editorial p-6 md:p-8">
        <h3 className="font-display text-2xl font-bold tracking-tight mb-2">
          Score Breakdown
        </h3>
        <hr className="rule-red mb-6" />
        <div className="space-y-5">
          {score.categories.map((cat) => {
            const ratio = cat.score / cat.max_score;
            return (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body text-sm">{cat.name}</span>
                  <span className="font-mono-label text-sm font-semibold">
                    {cat.score}/{cat.max_score}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  {cat.feedback}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div className="card-editorial p-6 md:p-8">
          <h3 className="font-display text-xl font-bold tracking-tight mb-2">
            Recommendations
          </h3>
          <hr className="rule-red mb-6" />
          <ol className="space-y-4">
            {score.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 bg-foreground text-background flex items-center justify-center font-mono-label text-xs font-bold">
                  {i + 1}
                </span>
                <span className="font-body text-sm leading-relaxed pt-1">
                  {rec}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-center">
        <button onClick={onContinue} className="btn-primary px-10 py-4">
          <span className="material-symbols-outlined text-base">arrow_forward</span>
          Optimize Your Resume
        </button>
      </div>
    </div>
  );
}
