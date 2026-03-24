"use client";

export default function LoadingState() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 space-y-8 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-muted" />
        <div className="space-y-2">
          <div className="h-6 bg-muted w-32" />
          <div className="h-4 bg-muted w-48" />
        </div>
      </div>
      <div className="flex justify-center">
        <div className="w-36 h-36 bg-muted" />
      </div>
      <hr className="rule-red opacity-30" />
      <div className="space-y-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-muted w-28" />
              <div className="h-4 bg-muted w-12" />
            </div>
            <div className="h-2 bg-muted w-full" />
          </div>
        ))}
      </div>
      <div className="h-32 bg-muted" />
    </div>
  );
}
