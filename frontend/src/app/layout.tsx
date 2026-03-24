import type { Metadata } from "next";
import {
  Playfair_Display,
  Newsreader,
  Noto_Serif,
  Lora,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import UserMenu from "@/components/UserMenu";
import TickerBar from "@/components/TickerBar";
import Link from "next/link";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TechGenie — The Digital Broadsheet",
  description:
    "AI-powered tools for CS students — analyze, optimize, stand out.",
};

const navLinks = [
  { href: "/", label: "GitHub Analyser" },
  { href: "/resume", label: "Resume Builder" },
  { href: "/compare", label: "Compare" },
  { href: "/cover-letter", label: "Cover Letter" },
  { href: "/skill-gap", label: "Skill Gap" },
  { href: "/linkedin-optimizer", label: "LinkedIn" },
  { href: "/jobs", label: "Jobs" },
  { href: "/dashboard", label: "Dashboard" },
];

function EditionBar() {
  const today = new Date();
  const formatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="edition-bar">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <span>Vol. 1 &middot; No. 1</span>
        <span className="hidden sm:inline">{formatted}</span>
        <span>Digital Edition</span>
      </div>
    </div>
  );
}

function Masthead() {
  return (
    <div className="masthead">
      <Link href="/">
        <h1>TECHGENIE</h1>
      </Link>
      <p className="subtitle">The Digital Broadsheet</p>
    </div>
  );
}

// TickerBar moved to @/components/TickerBar.tsx (client component)

function NavBar() {
  return (
    <nav className="border-b border-border-light bg-surface relative z-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-12 flex items-center justify-between">
        <div className="flex items-center gap-6 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-ui text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground hover:text-primary whitespace-nowrap transition-colors duration-100 py-3 border-b-[3px] border-transparent hover:border-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="font-ui text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors duration-100"
          >
            Pricing
          </Link>
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-brand text-2xl font-bold tracking-wider mb-2">
              TECHGENIE
            </h3>
            <p className="font-accent italic text-sm text-background/60">
              The Digital Broadsheet for CS Students
            </p>
          </div>
          <div>
            <h4 className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-background/40 mb-3">
              Tools
            </h4>
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-ui text-sm text-background/70 hover:text-background transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-ui text-[0.65rem] uppercase tracking-[0.15em] text-background/40 mb-3">
              Account
            </h4>
            <div className="flex flex-col gap-2">
              <Link
                href="/pricing"
                className="font-ui text-sm text-background/70 hover:text-background transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/dashboard"
                className="font-ui text-sm text-background/70 hover:text-background transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                className="font-ui text-sm text-background/70 hover:text-background transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-background/20 mt-8 pt-6 flex items-center justify-between">
          <p className="font-mono-label text-[0.65rem] text-background/40 tracking-widest uppercase">
            &copy; {new Date().getFullYear()} TechGenie. All rights reserved.
          </p>
          <p className="font-mono-label text-[0.65rem] text-background/40 tracking-widest uppercase">
            Digital Edition
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${newsreader.variable} ${notoSerif.variable} ${lora.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col relative z-10">
        <AuthProvider>
          <EditionBar />
          <Masthead />
          <NavBar />
          <TickerBar />
          <main className="flex-1 relative z-10">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
