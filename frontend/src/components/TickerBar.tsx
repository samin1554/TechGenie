"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const FALLBACK_ITEMS = [
  "LATEST: TOP ENGINEERING PROFILES ANALYZED DAILY",
  "RESUME OPTIMIZATION NOW AVAILABLE",
  "COMPARE YOUR GITHUB WITH PEERS",
  "SKILL GAP ANALYSIS POWERED BY AI",
  "COVER LETTERS TAILORED TO YOUR STACK",
];

export default function TickerBar() {
  const [items, setItems] = useState<string[]>(FALLBACK_ITEMS);

  useEffect(() => {
    api.getEditorials()
      .then((data) => {
        if (data.ticker.length > 0) {
          setItems(data.ticker.map((t) => t.toUpperCase()));
        }
      })
      .catch(() => {
        // Keep fallback items
      });
  }, []);

  // Duplicate for seamless loop
  const allItems = [...items, ...items, ...items];

  return (
    <div className="ticker-bar">
      <div className="marquee">
        <div className="marquee-content">
          {allItems.map((item, i) => (
            <span key={i}>
              {item} &bull;
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
