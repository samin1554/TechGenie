"use client";

import { forwardRef } from "react";
import { AnalysisResult } from "@/types/analysis";

interface ScoreCardProps {
  data: AnalysisResult;
}

const ScoreCard = forwardRef<HTMLDivElement, ScoreCardProps>(({ data }, ref) => {
  const score = data.scores.overall;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      ref={ref}
      className="bg-surface border border-foreground p-8 max-w-md w-full card-editorial"
    >
      <div className="flex items-center gap-4 mb-8">
        {data.avatar_url && (
          <img
            src={data.avatar_url}
            alt={data.github_username}
            className="w-16 h-16 border-2 border-foreground object-cover"
          />
        )}
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            {data.github_username}
          </h2>
          {data.bio && (
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2 font-accent italic">
              {data.bio}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center mb-8">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--border-light)"
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
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-bold tracking-tight">
              {Math.round(score)}
            </span>
            <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              Score
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center border-t border-border-light pt-6">
        <div>
          <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
            Repos
          </p>
          <p className="font-display text-xl font-bold mt-1">
            {data.stats.public_repos}
          </p>
        </div>
        <div>
          <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
            Followers
          </p>
          <p className="font-display text-xl font-bold mt-1">
            {data.stats.followers}
          </p>
        </div>
        <div>
          <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
            Stars
          </p>
          <p className="font-display text-xl font-bold mt-1">
            {data.stats.total_stars}
          </p>
        </div>
      </div>

      {data.top_languages && data.top_languages.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {data.top_languages.map((lang) => (
            <span
              key={lang}
              className="px-3 py-1 border border-border-light text-xs font-mono-label uppercase tracking-wider text-muted-foreground"
            >
              {lang}
            </span>
          ))}
        </div>
      )}

      <p className="text-center text-border-light text-xs mt-6 font-brand italic">
        TechGenie
      </p>
    </div>
  );
});

ScoreCard.displayName = "ScoreCard";
export default ScoreCard;
