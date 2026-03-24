"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import CreditsBadge from "./CreditsBadge";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="w-8 h-8 border border-foreground object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-sm font-ui font-bold">
            {(user.display_name || user.email)[0].toUpperCase()}
          </div>
        )}
        <CreditsBadge user={user} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-surface border border-foreground hard-shadow z-50">
          <div className="px-4 py-3 border-b border-border-light">
            <p className="text-sm font-ui font-medium truncate">
              {user.display_name || user.email}
            </p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              router.push("/dashboard");
            }}
            className="w-full text-left px-4 py-3 text-sm font-ui hover:text-primary transition-colors duration-100"
          >
            Dashboard
          </button>
          {user.is_premium && (
            <button
              onClick={async () => {
                setOpen(false);
                try {
                  const { api } = await import("@/lib/api");
                  const { portal_url } = await api.getPortal();
                  window.location.href = portal_url;
                } catch {
                  alert("No billing account linked. Your premium was activated manually.");
                }
              }}
              className="w-full text-left px-4 py-3 text-sm font-ui hover:text-primary transition-colors duration-100"
            >
              Manage Subscription
            </button>
          )}
          <button
            onClick={async () => {
              setOpen(false);
              await logout();
              router.push("/login");
            }}
            className="w-full text-left px-4 py-3 text-sm font-ui border-t border-border-light hover:text-primary transition-colors duration-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
