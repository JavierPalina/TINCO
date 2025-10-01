// src/components/ThemeToggle.tsx
"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const next = () => {
    // cicla: system -> dark -> light -> system
    if (theme === "system") setTheme("dark");
    else if (theme === "dark") setTheme("light");
    else setTheme("system");
  };

  return (
    <button
      onClick={next}
      aria-pressed={resolvedTheme === "dark"}
      title={`Tema: ${theme} (resuelto: ${resolvedTheme})`}
      className="inline-flex items-center gap-2 px-3 py-1 rounded border border-border bg-card text-card-foreground"
    >
      {resolvedTheme === "dark" ? "🌙" : "☀️"}
      <span className="sr-only">Cambiar tema</span>
      <span className="hidden md:inline">{theme === "system" ? "Sistema" : theme}</span>
    </button>
  );
}
