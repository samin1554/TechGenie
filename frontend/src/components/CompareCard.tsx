"use client";

import { ProfileSummary } from "@/types/compare";

interface CompareCardProps {
  userA: ProfileSummary;
  userB: ProfileSummary;
  winners: Record<string, string>;
}

const DIMENSIONS = [
  { key: "overall", label: "Overall" },
  { key: "project_diversity", label: "Project Diversity" },
  { key: "language_breadth", label: "Language Breadth" },
  { key: "commit_consistency", label: "Commit Consistency" },
  { key: "readme_quality", label: "README Quality" },
  { key: "community_engagement", label: "Community Engagement" },
  { key: "originality", label: "Originality" },
];

export default function CompareCard({ userA, userB, winners }: CompareCardProps) {
  return (
    <div className="space-y-8">
      {/* Avatars + Names */}
      <div className="flex items-center justify-between card-editorial p-6 md:p-8">
        <div className="flex items-center gap-4 flex-1">
          {userA.avatar_url && (
            <img
              src={userA.avatar_url}
              alt={userA.username}
              className="w-16 h-16 border border-foreground object-cover"
            />
          )}
          <div>
            <p className="font-display text-xl font-bold tracking-tight">
              {userA.username}
            </p>
            {userA.bio && (
              <p className="font-accent italic text-sm text-muted-foreground max-w-xs mt-1">
                {userA.bio}
              </p>
            )}
          </div>
        </div>

        <div className="px-6 text-center">
          <span className="font-display text-3xl font-bold text-primary">
            VS
          </span>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end text-right">
          <div>
            <p className="font-display text-xl font-bold tracking-tight">
              {userB.username}
            </p>
            {userB.bio && (
              <p className="font-accent italic text-sm text-muted-foreground max-w-xs mt-1">
                {userB.bio}
              </p>
            )}
          </div>
          {userB.avatar_url && (
            <img
              src={userB.avatar_url}
              alt={userB.username}
              className="w-16 h-16 border border-foreground object-cover"
            />
          )}
        </div>
      </div>

      {/* Score Comparison Bars */}
      <div className="card-editorial p-6 md:p-8">
        <h3 className="font-display text-2xl font-bold tracking-tight mb-2">
          Score Breakdown
        </h3>
        <hr className="rule-red mb-6" />
        <div className="space-y-5">
          {DIMENSIONS.map(({ key, label }) => {
            const scoreA = (userA.scores as any)[key] as number;
            const scoreB = (userB.scores as any)[key] as number;
            const winner = winners[key];
            const isOverall = key === "overall";

            return (
              <div
                key={key}
                className={isOverall ? "pb-5 border-b border-border-light mb-2" : ""}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-body text-sm ${
                      isOverall ? "font-bold" : ""
                    }`}
                  >
                    {label}
                  </span>
                  {winner !== "tie" ? (
                    <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-ui uppercase tracking-[0.15em]">
                      {winner} wins
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 border border-border-light text-[10px] font-ui uppercase tracking-[0.15em] text-muted-foreground">
                      Tie
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* User A bar */}
                  <div className="flex-1 flex items-center gap-2">
                    <span
                      className={`font-mono-label text-sm w-8 text-right ${
                        winner === userA.username ? "font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {Math.round(scoreA)}
                    </span>
                    <div className="flex-1 h-2 bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-700"
                        style={{ width: `${scoreA}%` }}
                      />
                    </div>
                  </div>

                  {/* User B bar */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted overflow-hidden">
                      <div
                        className="h-full bg-foreground/40 transition-all duration-700"
                        style={{ width: `${scoreB}%` }}
                      />
                    </div>
                    <span
                      className={`font-mono-label text-sm w-8 ${
                        winner === userB.username ? "font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {Math.round(scoreB)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Comparison — consistent borders */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        {[
          {
            label: "Public Repos",
            a: userA.stats.public_repos,
            b: userB.stats.public_repos,
          },
          { label: "Followers", a: userA.stats.followers, b: userB.stats.followers },
          {
            label: "Total Stars",
            a: userA.stats.total_stars,
            b: userB.stats.total_stars,
          },
          {
            label: "Account Age",
            a: `${Math.round(userA.stats.account_age_days / 365)}y`,
            b: `${Math.round(userB.stats.account_age_days / 365)}y`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border border-foreground p-4 -mt-px -ml-px first:mt-0 first:ml-0"
          >
            <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
              {stat.label}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-bold">{stat.a}</span>
              <span className="font-accent italic text-sm text-muted-foreground">
                vs
              </span>
              <span className="font-display text-xl font-bold">{stat.b}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Languages */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="border border-foreground p-5">
          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
            {userA.username}&apos;s Languages
          </p>
          <div className="flex flex-wrap gap-2">
            {userA.top_languages.map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 border border-foreground text-xs font-mono-label uppercase tracking-wider"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
        <div className="border border-foreground border-l-0 p-5">
          <p className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
            {userB.username}&apos;s Languages
          </p>
          <div className="flex flex-wrap gap-2">
            {userB.top_languages.map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 bg-primary text-white text-xs font-mono-label uppercase tracking-wider"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
