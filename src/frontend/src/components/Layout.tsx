import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Link } from "@tanstack/react-router";
import { FolderOpen, Mic, Settings } from "lucide-react";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-primary/20 bg-background/90 backdrop-blur-sm header-glow">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link
            to="/"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src="/assets/generated/aiservi-logo-transparent.dim_400x120.png"
              alt="aiservi"
              className="h-8 w-auto"
            />
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className="nav-link flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors [&.active]:text-primary [&.active]:bg-primary/10"
              data-ocid="nav.link"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Projects</span>
            </Link>
            <Link
              to="/voice"
              className="nav-link flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors [&.active]:text-primary [&.active]:bg-primary/10"
              data-ocid="nav.link"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Voice</span>
            </Link>
            <Link
              to="/settings"
              className="nav-link flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors [&.active]:text-primary [&.active]:bg-primary/10"
              data-ocid="nav.link"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>

      <footer className="border-t border-border py-4 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} aiservi. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster />
    </div>
  );
}
