export interface Scores {
  overall: number;
  project_diversity: number;
  language_breadth: number;
  commit_consistency: number;
  readme_quality: number;
  community_engagement: number;
  originality: number;
}

export interface RepoSummary {
  name: string;
  stars: number;
  language: string | null;
  description: string | null;
}

export interface Stats {
  public_repos: number;
  followers: number;
  account_age_days: number;
  total_stars: number;
}

export interface AnalysisResult {
  id: string;
  github_username: string;
  avatar_url: string | null;
  bio: string | null;
  scores: Scores;
  llm_feedback: string | null;
  suggestions: string[] | null;
  top_languages: string[] | null;
  top_repos: RepoSummary[] | null;
  stats: Stats;
  credits_remaining: number;
  created_at: string;
}

export interface HistoryItem {
  id: string;
  github_username: string;
  avatar_url: string | null;
  score_overall: number;
  scores: Scores;
  created_at: string;
}
