'use client';

import { useTheme } from "@/lib/ThemeContext";

export default function ThemeToggle() {
  const { themeName, theme, toggleTheme } = useTheme();

  const isFocus = themeName === "focus";
  const label = isFocus ? "Focus" : "Breeze";
  const icon = isFocus ? "🔥" : "🌿";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        backgroundColor: theme.primarySoft,
        color: theme.text,
        borderRadius: 999,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
      }}
      aria-label={`Switch to ${isFocus ? "Breeze" : "Focus"} theme`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="hidden sm:inline">
        {label} mode
      </span>
    </button>
  );
}

