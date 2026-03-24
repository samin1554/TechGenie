"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import UpgradeModal from "@/components/UpgradeModal";

interface Job {
  title: string;
  company: string;
  location: string;
  date_posted: string;
  employment_type: string | null;
  is_remote: boolean;
  description_snippet: string;
  apply_url: string;
  company_logo: string | null;
}

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  has_more: boolean;
}

export default function JobsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState("Software Engineer");
  const [searchInput, setSearchInput] = useState("Software Engineer");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [data, setData] = useState<JobsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const fetchJobs = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.searchJobs({
        q: query,
        location: location || undefined,
        employment_type: employmentType || undefined,
        remote_only: remoteOnly || undefined,
        page,
      });
      setData(res);
    } catch (err: any) {
      if (err.status === 403) {
        setShowUpgrade(true);
      } else {
        setError(err.message || "Failed to fetch jobs");
      }
    } finally {
      setLoading(false);
    }
  }, [query, location, employmentType, remoteOnly, page]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchJobs();
    }
  }, [fetchJobs, user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (showUpgrade) {
    return <UpgradeModal open={true} onClose={() => setShowUpgrade(false)} />;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(searchInput);
  };

  const formatEmploymentType = (type: string | null) => {
    if (!type) return null;
    const map: Record<string, string> = {
      FULLTIME: "Full-time",
      PARTTIME: "Part-time",
      INTERN: "Internship",
      CONTRACTOR: "Contract",
    };
    return map[type] || type;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      {/* Header */}
      <div className="mb-4">
        <p className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">
          Careers Desk
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Job Board
        </h1>
        <p className="font-body text-muted-foreground mt-2">
          Real-time listings from LinkedIn, Indeed, Glassdoor &amp; more
        </p>
      </div>

      <hr className="section-rule mb-8" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
            search
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Job title, keyword, or company..."
            className="w-full pl-10 pr-4 py-3 border border-foreground bg-surface font-body placeholder:text-muted-foreground placeholder:italic focus:border-b-2 focus:border-b-primary transition-colors duration-100"
          />
        </div>
        <button type="submit" className="btn-primary px-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">search</span>
          Search
        </button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <input
          type="text"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setPage(1);
          }}
          placeholder="Location..."
          className="px-3 py-2 border border-foreground bg-surface font-body text-sm placeholder:text-muted-foreground placeholder:italic w-48"
        />

        <select
          value={employmentType}
          onChange={(e) => {
            setEmploymentType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-foreground bg-surface font-body text-sm cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="internship">Internship</option>
          <option value="contract">Contract</option>
        </select>

        <label className="flex items-center gap-2 font-body text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => {
              setRemoteOnly(e.target.checked);
              setPage(1);
            }}
            className="accent-[var(--primary)] w-4 h-4"
          />
          Remote Only
        </label>
      </div>

      {/* Results Count */}
      {data && !loading && (
        <div className="flex items-center gap-3 mb-6">
          <hr className="flex-1 rule-thin" />
          <span className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">
            {data.total > 0 ? `${data.total.toLocaleString()} jobs found` : "No results"}
          </span>
          <hr className="flex-1 rule-thin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 border border-primary bg-primary/5 font-body text-sm text-primary mb-6">
          {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-editorial p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-muted w-3/4" />
                  <div className="h-3 bg-muted w-1/2" />
                  <div className="h-3 bg-muted w-full" />
                  <div className="h-3 bg-muted w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Cards */}
      {!loading && data && data.jobs.length > 0 && (
        <div className="space-y-4">
          {data.jobs.map((job, i) => (
            <div key={i} className="card-editorial p-6 hover:border-primary/40 transition-colors">
              <div className="flex gap-4">
                {/* Company Logo */}
                <div className="w-12 h-12 flex-shrink-0 border border-border-light flex items-center justify-center overflow-hidden bg-surface">
                  {job.company_logo ? (
                    <img
                      src={job.company_logo}
                      alt={job.company}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                          `<span class="font-display text-lg font-bold text-muted-foreground">${job.company[0]}</span>`;
                      }}
                    />
                  ) : (
                    <span className="font-display text-lg font-bold text-muted-foreground">
                      {job.company[0]}
                    </span>
                  )}
                </div>

                {/* Job Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-bold tracking-tight mb-1 truncate">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-xs text-muted-foreground mb-3">
                    <span className="font-semibold text-foreground">{job.company}</span>
                    <span>&middot;</span>
                    <span>{job.location}</span>
                    {(job.employment_type || job.is_remote) && <span>&middot;</span>}
                    {job.employment_type && (
                      <span>{formatEmploymentType(job.employment_type)}</span>
                    )}
                    {job.is_remote && (
                      <span className="px-1.5 py-0.5 border border-primary/30 text-primary text-[10px] uppercase tracking-wider font-ui">
                        Remote
                      </span>
                    )}
                    <span>&middot;</span>
                    <span>{job.date_posted}</span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {job.description_snippet}
                  </p>
                </div>

                {/* Apply Button */}
                <div className="flex-shrink-0 self-center">
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline py-2 px-4 flex items-center gap-1.5 text-sm whitespace-nowrap"
                  >
                    Apply
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && data && data.jobs.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-muted-foreground mb-4 block">
            work_off
          </span>
          <p className="font-display text-xl font-bold mb-2">No jobs found</p>
          <p className="font-body text-sm text-muted-foreground">
            Try different search terms or adjust your filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && data && data.jobs.length > 0 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-light">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-ghost flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Previous
          </button>
          <span className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.has_more}
            className="btn-ghost flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      )}
    </div>
  );
}
