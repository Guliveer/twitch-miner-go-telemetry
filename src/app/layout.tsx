import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/lib/theme";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { HeaderScroll } from "@/components/header-scroll";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-heading-family",
  display: "swap",
});

export const metadata: Metadata = {
  title: "twitch-miner-go Telemetry",
  description: "Instance adoption and version distribution dashboard for twitch-miner-go",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("min-h-full", "antialiased", interTight.variable, "font-sans", jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body className="noise-overlay relative min-h-dvh flex flex-col">
        <ThemeProvider>
          <HeaderScroll>
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center gap-3 text-sm font-semibold tracking-tight group">
                <svg width="18" height="18" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent shrink-0">
                  <rect x="32" y="48" width="192" height="144" rx="0" stroke="currentColor" strokeWidth="16" fill="none" />
                  <line x1="160" y1="224" x2="96" y2="224" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />
                  <line x1="128" y1="192" x2="128" y2="224" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />
                  <circle cx="128" cy="120" r="6" fill="currentColor" opacity="0.5" />
                  <line x1="96" y1="72" x2="160" y2="72" stroke="currentColor" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
                </svg>
                <span className="text-foreground/80 group-hover:text-foreground transition-colors duration-150">
                  twitch-miner-go
                </span>
                <span className="label-mono text-muted-foreground/40 group-hover:text-muted-foreground transition-colors duration-150">
                  Telemetry
                </span>
              </a>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <LogoutButton />
              </div>
            </div>
          </HeaderScroll>
          <main className="flex-1 pt-12 relative z-0">
            {children}
          </main>
          <footer className="px-6 py-6 text-center text-xs text-muted-foreground/40">
            <span className="label-mono text-[10px]">
              Telemetry for{" "}
              <a
                href="https://github.com/Guliveer/twitch-miner-go"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-muted-foreground transition-colors duration-150"
              >
                twitch-miner-go
              </a>
            </span>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
