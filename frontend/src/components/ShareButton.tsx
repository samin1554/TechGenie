"use client";

import { useState } from "react";
import html2canvas from "html2canvas";

interface ShareButtonProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  username: string;
}

export default function ShareButton({ cardRef, username }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `techgenie-${username}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex gap-0">
      <button
        onClick={handleCopyLink}
        className="btn-outline flex items-center gap-2 py-3"
      >
        <span className="material-symbols-outlined text-base">link</span>
        {copied ? "Copied" : "Copy Link"}
      </button>
      <button
        onClick={handleDownload}
        className="btn-primary flex items-center gap-2 py-3"
      >
        <span className="material-symbols-outlined text-base">download</span>
        Download &rarr;
      </button>
    </div>
  );
}
