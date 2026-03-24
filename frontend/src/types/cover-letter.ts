export interface CoverLetterRequest {
  job_description: string;
  resume_text?: string;
  github_username?: string;
}

export interface CoverLetterResponse {
  cover_letter: string;
  credits_remaining: number;
}
