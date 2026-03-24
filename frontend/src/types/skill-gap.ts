export interface SkillMatch {
  skill: string;
  status: "match" | "partial" | "missing";
  source: string | null;
}

export interface SkillGapResponse {
  matching: SkillMatch[];
  partial: SkillMatch[];
  missing: SkillMatch[];
  recommendations: string[];
  match_percentage: number;
  credits_remaining: number;
}
