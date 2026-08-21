"use client";

import { useEffect, useState } from "react";
import type { Theme } from "../../lib/theme";
import { getActiveTheme, toggleTheme } from "../../lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    setThemeState(getActiveTheme());
  }, []);

  function handleClick() {
    setThemeState(toggleTheme());
  }

  return (
    <button
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={`theme-toggle ${className}`.trim()}
      onClick={handleClick}
      title={theme === "dark" ? "Light theme" : "Dark theme"}
      type="button"
    >
      <svg aria-hidden="true" className="theme-icon-moon" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="16">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      <svg aria-hidden="true" className="theme-icon-sun" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="16">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
