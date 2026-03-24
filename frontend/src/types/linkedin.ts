export interface LinkedInOptimizeResponse {
  optimized_headline: string;
  optimized_about: string;
  keywords: string[];
  strength_score: number;
  suggestions: string[];
  credits_remaining: number;
}
