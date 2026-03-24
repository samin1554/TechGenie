"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResumeUsernamePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main resume page — resume generation now uses the wizard flow
    router.replace("/resume");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
