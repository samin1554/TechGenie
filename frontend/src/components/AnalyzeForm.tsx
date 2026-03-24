"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnalyzeForm() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const extractUsername = (value: string): string => {
    const trimmed = value.trim();
    const match = trimmed.match(/github\.com\/([a-zA-Z0-9-]+)/);
    if (match) return match[1];
    return trimmed.replace(/^@/, "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const username = extractUsername(input);
    if (!username) return;
    router.push(`/analyze/${username}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-0 w-full max-w-xl hard-shadow-hover bg-surface"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter username or GitHub URL"
        className="flex-1 px-4 py-4 border border-foreground border-r-0 bg-surface text-foreground font-body text-lg placeholder:text-muted-foreground placeholder:italic focus:border-b-2 focus:border-b-primary transition-colors duration-100"
      />
      <button
        type="submit"
        disabled={!input.trim()}
        className="px-8 py-4 bg-primary text-white font-ui text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary-dark border border-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-base">search</span>
        Analyze
      </button>
    </form>
  );
}
