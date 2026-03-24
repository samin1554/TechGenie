export interface ResumeHeader {
  name: string;
  email: string | null;
  phone: string | null;
  github_url: string | null;
  location: string | null;
  linkedin: string | null;
  website: string | null;
}

export interface ResumeSkills {
  languages: string[];
  frameworks: string[];
  tools: string[];
  other: string[];
}

export interface ResumeProject {
  name: string;
  tech_stack: string;
  url: string | null;
  bullets: string[];
}

export interface ResumeExperience {
  title: string;
  org: string;
  date_range: string | null;
  bullets: string[];
}

export interface ResumeEducation {
  school: string;
  degree: string;
  date_range: string | null;
  details: string | null;
}

export interface ResumeResult {
  id: string;
  github_username: string | null;
  header: ResumeHeader;
  summary: string;
  skills: ResumeSkills;
  projects: ResumeProject[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  template: string;
  is_edited: boolean;
  credits_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface ResumeListItem {
  id: string;
  github_username: string | null;
  header_name: string;
  template: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface ATSScoreCategory {
  name: string;
  score: number;
  max_score: number;
  feedback: string;
}

export interface ATSScoreResult {
  overall: number;
  categories: ATSScoreCategory[];
  summary: string;
  recommendations: string[];
}

export interface GenerateResumePayload {
  resume_text: string;
  template: string;
  role: string;
  job_description?: string;
  tone: string;
  github_username?: string;
}

export const ROLE_OPTIONS = [
  { value: "software_engineer", label: "Software Engineer" },
  { value: "frontend_engineer", label: "Frontend Engineer" },
  { value: "backend_engineer", label: "Backend Engineer" },
  { value: "fullstack_engineer", label: "Full Stack Engineer" },
  { value: "ai_ml_engineer", label: "AI / ML Engineer" },
  { value: "data_engineer", label: "Data Engineer" },
  { value: "devops_sre", label: "DevOps / SRE" },
  { value: "mobile_engineer", label: "Mobile Engineer" },
  { value: "cybersecurity_engineer", label: "Cybersecurity Engineer" },
  { value: "other", label: "Other" },
] as const;

export const TONE_OPTIONS = [
  { value: "conservative", label: "Conservative", description: "Minimal changes, professional tone" },
  { value: "balanced", label: "Balanced", description: "Improved clarity with reasonable impact" },
  { value: "creative", label: "Creative", description: "Bold language, maximum impact" },
] as const;

export const TEMPLATE_OPTIONS = [
  { value: "jake", label: "Jake's Resume", description: "Classic LaTeX SWE template" },
  { value: "swe_default", label: "SWE Default", description: "Clean modern template" },
] as const;
