"use client";

import { Scores } from "@/types/analysis";

const dimensions = [
  { key: "project_diversity", label: "Project Diversity" },
  { key: "language_breadth", label: "Language Breadth" },
  { key: "commit_consistency", label: "Commit Consistency" },
  { key: "readme_quality", label: "README Quality" },
  { key: "community_engagement", label: "Community Engagement" },
  { key: "originality", label: "Originality" },
] as const;

export default function ScoreBreakdown({ scores }: { scores: Scores }) {
  return (
    <div className="space-y-6">
      <h3 className="font-display text-2xl font-bold tracking-tight">
        Score Breakdown
      </h3>
      <hr className="rule-red" />
      <div className="space-y-5">
        {dimensions.map(({ key, label }) => {
          const score = scores[key];
          return (
            <div key={key}>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-body">{label}</span>
                <span className="font-mono-label text-sm font-semibold">
                  {Math.round(score)}
                </span>
              </div>
              <div className="w-full bg-muted h-2">
                <div
                  className="h-2 bg-primary transition-all duration-700"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
