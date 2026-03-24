export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  github_username: string | null;
  credits_remaining: number;
  is_premium: boolean;
}
