'use client';

import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { useTheme } from "@/lib/ThemeContext";

type RewardProps = {
  visible: boolean;
  progress: number;
  onClose: () => void;
};

const EMOJIS = ["🔥", "🌿", "🚀", "⭐️", "🎉", "💡", "🏆", "✨", "🧠", "🌈"];

function pickRandomEmoji() {
  const idx = Math.floor(Math.random() * EMOJIS.length);
  return EMOJIS[idx] ?? "🎉";
}

export default function Reward({ visible, progress, onClose }: RewardProps) {
  const { theme } = useTheme();
  const [emoji, setEmoji] = useState<string>("🎉");

  const message = useMemo(() => {
    if (progress >= 0.95) {
      return "You just cleared the board. This is what deep work looks like.";
    }
    if (progress >= 0.7) {
      return "You’re in flow. One more push and today is a win.";
    }
    if (progress >= 0.4) {
      return "Momentum unlocked. Keep chaining small wins together.";
    }
    if (progress > 0) {
      return "You’ve started. Most people never get this far today.";
    }
    return "Nice completion! Stay in motion.";
  }, [progress]);

  useEffect(() => {
    if (!visible) return;
    setEmoji(pickRandomEmoji());

    try {
      const end = Date.now() + 600;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 9999,
      };

      const frame = () => {
        confetti({
          ...defaults,
          particleCount: 40,
          origin: {
            x: Math.random() * 0.3 + 0.35,
            y: Math.random() * 0.2 + 0.1,
          },
          colors: [theme.primary, theme.accent, "#ffffff"],
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    } catch {
      // ignore confetti errors
    }

    const timeout = window.setTimeout(() => {
      onClose();
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [visible, onClose, theme.primary, theme.accent]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(15,23,42,0.65)" }}
        onClick={onClose}
      />
      <div
        className="relative z-50 w-full max-w-sm rounded-3xl p-5 text-sm shadow-2xl sm:p-6"
        style={{
          background:
            theme.name === "focus"
              ? "radial-gradient(circle at top, rgba(248,113,22,0.2), #020617)"
              : "radial-gradient(circle at top, rgba(52,211,153,0.18), #ecfeff)",
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadow,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/20 text-2xl">
            {emoji}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Reward Unlocked
            </p>
            <h3 className="mt-1 text-base font-semibold">
              Task completed — nice work.
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {message}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: theme.primarySoft,
            color: theme.text,
            border: `1px solid ${theme.border}`,
          }}
        >
          Keep going
        </button>
      </div>
    </div>
  );
}

