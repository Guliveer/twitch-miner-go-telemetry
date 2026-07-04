import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-mono", jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <header className="flex items-center justify-end border-b border-border px-6 py-2">
            <ThemeToggle />
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
            Telemetry for{" "}
            <a
              href="https://github.com/Guliveer/twitch-miner-go"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              twitch-miner-go
            </a>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
