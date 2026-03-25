const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Token stored in memory + localStorage for persistence
let _token: string | null = null;

export function setToken(token: string | null) {
  _token = token;
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

export function getToken(): string | null {
  if (!_token && typeof window !== "undefined") {
    _token = localStorage.getItem("token");
  }
  return _token;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const error: any = new Error(data?.detail?.message || data?.detail || "Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return res.json();
}

export const api = {
  // Auth
  getGitHubRedirect: () => apiFetch<{ redirect_url: string }>("/auth/github"),
  getGoogleRedirect: () => apiFetch<{ redirect_url: string }>("/auth/google"),
  githubCallback: async (code: string, state: string) => {
    const res = await apiFetch<{ access_token: string; user: any }>("/auth/github/callback", {
      method: "POST",
      body: JSON.stringify({ code, state }),
    });
    setToken(res.access_token);
    return res;
  },
  googleCallback: async (code: string, state: string) => {
    const res = await apiFetch<{ access_token: string; user: any }>("/auth/google/callback", {
      method: "POST",
      body: JSON.stringify({ code, state }),
    });
    setToken(res.access_token);
    return res;
  },
  getMe: () => apiFetch<any>("/auth/me"),
  logout: async () => {
    const res = await apiFetch<any>("/auth/logout", { method: "POST" });
    setToken(null);
    return res;
  },

  // Analysis
  analyze: (github_username: string) =>
    apiFetch<any>("/analyze", {
      method: "POST",
      body: JSON.stringify({ github_username }),
    }),
  getAnalysis: (id: string) => apiFetch<any>(`/analysis/${id}`),

  // History
  getHistory: () => apiFetch<{ analyses: any[] }>("/history").then((r) => r.analyses),
  deleteHistory: (id: string) => apiFetch<any>(`/history/${id}`, { method: "DELETE" }),

  // Resume
  parseResume: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/v1/resume/parse`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const error: any = new Error(data?.detail || "Failed to parse PDF");
      error.status = res.status;
      throw error;
    }
    return res.json() as Promise<{ text: string }>;
  },
  scoreResume: (resume_text: string, role?: string) =>
    apiFetch<any>("/resume/score", {
      method: "POST",
      body: JSON.stringify({ resume_text, role: role || null }),
    }),
  generateResume: (payload: {
    resume_text: string;
    template: string;
    role: string;
    job_description?: string;
    tone: string;
    github_username?: string;
  }) =>
    apiFetch<any>("/resume/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getResume: (id: string) => apiFetch<any>(`/resume/${id}`),
  listResumes: () => apiFetch<any[]>("/resume/list"),
  updateResume: (id: string, data: any) =>
    apiFetch<any>(`/resume/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteResume: (id: string) => apiFetch<any>(`/resume/${id}`, { method: "DELETE" }),

  // Compare
  compareProfiles: (username_a: string, username_b: string) =>
    apiFetch<any>("/compare", {
      method: "POST",
      body: JSON.stringify({ username_a, username_b }),
    }),

  // Cover Letter
  generateCoverLetter: (payload: { job_description: string; resume_text?: string; github_username?: string }) =>
    apiFetch<any>("/cover-letter/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Skill Gap
  analyzeSkillGap: (payload: { job_description: string; github_username?: string; resume_text?: string }) =>
    apiFetch<any>("/skill-gap/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // News (public, no auth)
  getEditorials: () => apiFetch<{ editorials: { date: string; title: string; byline: string; url: string | null }[]; ticker: string[] }>("/news/editorials"),

  // LinkedIn Optimizer
  optimizeLinkedIn: (payload: {
    headline: string;
    about: string;
    target_role?: string;
    github_username?: string;
  }) =>
    apiFetch<any>("/linkedin/optimize", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Jobs
  searchJobs: (params: {
    q: string;
    location?: string;
    employment_type?: string;
    remote_only?: boolean;
    page?: number;
  }) => {
    const searchParams = new URLSearchParams({ q: params.q });
    if (params.location) searchParams.set("location", params.location);
    if (params.employment_type) searchParams.set("employment_type", params.employment_type);
    if (params.remote_only) searchParams.set("remote_only", "true");
    if (params.page) searchParams.set("page", String(params.page));
    return apiFetch<any>(`/jobs/search?${searchParams}`);
  },

  // Billing
  createCheckout: () => apiFetch<{ checkout_url: string }>("/billing/checkout", { method: "POST" }),
  getPortal: () => apiFetch<{ portal_url: string }>("/billing/portal"),
};
