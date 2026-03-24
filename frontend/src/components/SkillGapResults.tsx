"use client";

import { SkillGapResponse } from "@/types/skill-gap";

interface SkillGapResultsProps {
  result: SkillGapResponse;
}

export default function SkillGapResults({ result }: SkillGapResultsProps) {
  const circumference = 2 * Math.PI * 54;
  const progress = (result.match_percentage / 100) * circumference;

  return (
    <div className="space-y-8">
      {/* Match Percentage Circle */}
      <div className="card-editorial p-8 md:p-10 text-center">
        <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-6">
          Skill Match
        </p>
        <div className="relative w-40 h-40 mx-auto mb-4">
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
              {Math.round(result.match_percentage)}
            </span>
            <span className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
              Percent
            </span>
          </div>
        </div>
      </div>

      {/* Skill Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        {/* Matching Skills */}
        <div className="border border-foreground p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-600" />
            <h3 className="font-ui text-[10px] uppercase tracking-[0.15em]">
              Matching ({result.matching.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.matching.map((s) => (
              <span
                key={s.skill}
                className="px-3 py-1 border border-green-700 text-green-700 text-xs font-mono-label"
                title={s.source ? `Source: ${s.source}` : undefined}
              >
                {s.skill}
              </span>
            ))}
            {result.matching.length === 0 && (
              <p className="font-body text-sm text-muted-foreground italic">
                No matching skills found
              </p>
            )}
          </div>
        </div>

        {/* Partial Skills */}
        <div className="border border-foreground -ml-px p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-yellow-600" />
            <h3 className="font-ui text-[10px] uppercase tracking-[0.15em]">
              Partial ({result.partial.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.partial.map((s) => (
              <span
                key={s.skill}
                className="px-3 py-1 border border-yellow-600 text-yellow-700 text-xs font-mono-label"
                title={s.source ? `Source: ${s.source}` : undefined}
              >
                {s.skill}
              </span>
            ))}
            {result.partial.length === 0 && (
              <p className="font-body text-sm text-muted-foreground italic">
                No partial matches
              </p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="border border-foreground -ml-px p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-red-600" />
            <h3 className="font-ui text-[10px] uppercase tracking-[0.15em]">
              Missing ({result.missing.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.missing.map((s) => (
              <span
                key={s.skill}
                className="px-3 py-1 bg-primary text-white text-xs font-mono-label"
              >
                {s.skill}
              </span>
            ))}
            {result.missing.length === 0 && (
              <p className="font-body text-sm text-muted-foreground italic">
                No missing skills!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="card-editorial p-6 md:p-8">
          <h3 className="font-display text-2xl font-bold tracking-tight mb-2">
            How to Close the Gap
          </h3>
          <hr className="rule-red mb-6" />
          <ol className="space-y-4">
            {result.recommendations.map((rec, i) => (
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
    </div>
  );
}
