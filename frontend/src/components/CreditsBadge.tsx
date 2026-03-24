"use client";

import { User } from "@/types/user";

export default function CreditsBadge({ user }: { user: User }) {
  if (user.is_premium) {
    return (
      <span className="px-3 py-1 bg-primary text-white text-[10px] font-ui uppercase tracking-[0.15em] font-bold">
        Premium
      </span>
    );
  }

  return (
    <span className="px-3 py-1 border border-foreground text-foreground text-[10px] font-mono-label uppercase tracking-widest">
      {user.credits_remaining} credit{user.credits_remaining !== 1 ? "s" : ""}
    </span>
  );
}
