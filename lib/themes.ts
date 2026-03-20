export type ThemeName = "focus" | "breeze";

export type Theme = {
  name: ThemeName;
  displayName: string;
  background: string;
  surface: string;
  surfaceSoft: string;
  primary: string;
  primarySoft: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  shadow: string;
  progressBg: string;
  progressFg: string;
  clockFace: string;
  clockHand: string;
};

export const themes: Record<ThemeName, Theme> = {
  focus: {
    name: "focus",
    displayName: "Focus",
    background: "#050816",
    surface: "#111827",
    surfaceSoft: "#020617",
    primary: "#f97316",
    primarySoft: "rgba(248, 113, 22, 0.16)",
    accent: "#facc15",
    text: "#f9fafb",
    textMuted: "#9ca3af",
    border: "rgba(148, 163, 184, 0.4)",
    shadow: "0 20px 45px rgba(0,0,0,0.85)",
    progressBg: "rgba(15, 23, 42, 0.9)",
    progressFg: "#f97316",
    clockFace: "#020617",
    clockHand: "#f97316",
  },
  breeze: {
    name: "breeze",
    displayName: "Breeze",
    background: "#ecfeff",
    surface: "#f9fafb",
    surfaceSoft: "#e0f2fe",
    primary: "#0ea5e9",
    primarySoft: "rgba(14, 165, 233, 0.14)",
    accent: "#22c55e",
    text: "#0f172a",
    textMuted: "#6b7280",
    border: "rgba(148, 163, 184, 0.55)",
    shadow: "0 18px 40px rgba(15,23,42,0.18)",
    progressBg: "rgba(226, 232, 240, 0.95)",
    progressFg: "#22c55e",
    clockFace: "#e0f2fe",
    clockHand: "#0ea5e9",
  },
};

export function getTheme(name: ThemeName): Theme {
  return themes[name];
}

