import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-dashed border-border/80 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm text-muted-foreground">
          Built by <span className="font-medium text-foreground">Abhirai2006</span>
        </p>
        <a
          href="https://github.com/Abhirai2006"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
        >
          <Github className="h-4 w-4" />
          GitHub
        </a>
      </div>
    </footer>
  );
}
