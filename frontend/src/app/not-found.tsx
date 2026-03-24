import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Page Not Found
        </p>
        <h1 className="font-display text-8xl md:text-9xl font-bold tracking-tight mb-4">
          404
        </h1>
        <hr className="section-rule mb-6" />
        <p className="font-body text-muted-foreground mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn-primary px-8 py-3 inline-block">
          Return to Front Page
        </Link>
      </div>
    </div>
  );
}
