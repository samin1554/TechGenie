"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Unexpected Error
        </p>
        <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tight mb-4">
          Oops
        </h1>
        <hr className="section-rule mb-6" />
        <p className="font-body text-muted-foreground mb-8 leading-relaxed">
          Something went wrong. Our engineers have been notified.
        </p>
        <button
          onClick={reset}
          className="btn-primary px-8 py-3"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
