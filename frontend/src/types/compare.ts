import { Scores, RepoSummary, Stats } from "./analysis";

export interface ProfileSummary {
  username: string;
  avatar_url: string | null;
  bio: string | null;
  scores: Scores;
  top_languages: string[];
  top_repos: RepoSummary[];
  stats: Stats;
}

export interface CompareResponse {
  user_a: ProfileSummary;
  user_b: ProfileSummary;
  winners: Record<string, string>;
}
