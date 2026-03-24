"use client";

interface InsightPanelProps {
  feedback: string | null;
  suggestions: string[] | null;
}

export default function InsightPanel({ feedback, suggestions }: InsightPanelProps) {
  if (!feedback && (!suggestions || suggestions.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="font-display text-2xl font-bold tracking-tight">
          AI Insights
        </h3>
        <span className="font-ui text-[10px] uppercase tracking-[0.15em] bg-primary text-white px-2 py-0.5">
          AI Analysis
        </span>
      </div>
      <hr className="rule-red" />

      {feedback && (
        <div className="border-l-4 border-primary pl-6 py-2">
          <p className="font-body text-base leading-relaxed text-muted-foreground">
            {feedback}
          </p>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="bg-surface border border-foreground p-6">
          <h4 className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Recommendations
          </h4>
          <ol className="space-y-4">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 bg-foreground text-background flex items-center justify-center font-mono-label text-xs font-bold">
                  {i + 1}
                </span>
                <span className="font-body text-sm leading-relaxed pt-1">
                  {suggestion}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
