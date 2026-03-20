'use client';

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import {
  calcConsecutiveStreak,
  calcFocusMinutes,
  calcFocusScore,
  calcFocusProgress,
  calcTasksProgress,
  getDateKey,
  getFocusStorageKey,
  getLastNDatesNewestFirst,
  getTodosStorageKey,
  isGoalHit,
  PomodoroFocusEntry,
  StoredTodo,
} from "@/lib/stats";

type WeeklyBucket = {
  dateKey: string;
  label: string;
  focusMinutes: number;
};

type StatsModel = {
  todayDateKey: string;
  tasks: {
    total: number;
    completed: number;
    progress: number;
  };
  focus: {
    focusMinutes: number;
    pomodorosCompleted: number;
    focusProgress: number;
  };
  focusScore: number;
  streak: number;
  weekly: WeeklyBucket[];
  goalHitToday: boolean;
};

function parseJsonArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as T[];
  } catch {
    return [];
  }
}

function safeThemeLabel(date: Date) {
  // Client-only formatting to avoid SSR/client mismatches.
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
    date,
  );
}

export default function StatsAndProgress() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<StatsModel | null>(null);

  const targetMinutes = 25;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compute = () => {
      const today = new Date();
      const todayDateKey = getDateKey(today);
      const dateKeysNewestFirst = getLastNDatesNewestFirst(7, today);

      const todosByDateKey: Record<string, StoredTodo[]> = {};
      const focusByDateKey: Record<string, PomodoroFocusEntry[]> = {};
      const goalHitByDateKey: Record<string, boolean> = {};
      const weekly: WeeklyBucket[] = [];

      for (const dateKey of dateKeysNewestFirst) {
        const todosRaw = window.localStorage.getItem(
          getTodosStorageKey(dateKey),
        );
        const focusRaw = window.localStorage.getItem(
          getFocusStorageKey(dateKey),
        );

        const todos = parseJsonArray<StoredTodo>(todosRaw).filter((t) => {
          return (
            t &&
            typeof t.id === "string" &&
            typeof t.text === "string" &&
            typeof t.completed === "boolean"
          );
        });

        const focusEntries = parseJsonArray<PomodoroFocusEntry>(focusRaw).filter(
          (e) => {
            return (
              e &&
              typeof e.id === "string" &&
              typeof e.completedAtISO === "string" &&
              typeof e.durationMinutes === "number"
            );
          },
        );

        todosByDateKey[dateKey] = todos;
        focusByDateKey[dateKey] = focusEntries;
        goalHitByDateKey[dateKey] = isGoalHit({
          todos,
          focusEntries,
        });

        // Build weekly chart buckets
        const d = new Date(today);
        const [yy, mm, dd] = dateKey.split("-").map((x) => Number(x));
        d.setFullYear(yy, mm - 1, dd);
        weekly.push({
          dateKey,
          label: safeThemeLabel(d),
          focusMinutes: calcFocusMinutes(focusEntries),
        });
      }

      const todayTodos = todosByDateKey[todayDateKey] ?? [];
      const todayFocus = focusByDateKey[todayDateKey] ?? [];

      const tasks = calcTasksProgress(todayTodos);
      const focusMinutes = calcFocusMinutes(todayFocus);
      const focusProgress = calcFocusProgress(focusMinutes, targetMinutes);

      const focusScore = calcFocusScore({
        todos: todayTodos,
        focusEntries: todayFocus,
        targetMinutes,
      });

      const streak = calcConsecutiveStreak({
        dateKeysNewestToOldest: dateKeysNewestFirst,
        goalHitByDateKey,
      });

      setStats({
        todayDateKey,
        tasks,
        focus: {
          focusMinutes,
          pomodorosCompleted: todayFocus.length,
          focusProgress,
        },
        focusScore,
        streak,
        weekly: weekly.slice().reverse(), // chronological oldest -> newest for chart
        goalHitToday: goalHitByDateKey[todayDateKey] ?? false,
      });
    };

    compute();
    const interval = window.setInterval(compute, 1200);
    return () => window.clearInterval(interval);
  }, []);

  const weeklyMax = useMemo(() => {
    if (!stats) return 1;
    const max = Math.max(0, ...stats.weekly.map((b) => b.focusMinutes));
    return max <= 0 ? 1 : max;
  }, [stats]);

  if (!stats) {
    return (
      <section
        aria-label="Stats and progress"
        className="w-full rounded-3xl p-6 sm:p-8"
        style={{
          backgroundColor: theme.surface,
          boxShadow: theme.shadow,
          border: `1px solid ${theme.border}`,
        }}
      >
        <p style={{ color: theme.textMuted }} className="text-sm">
          Loading stats...
        </p>
      </section>
    );
  }

  const focusHoursTotal = (stats.focus.focusMinutes / 60).toFixed(1);
  const percentTasks = Math.round(stats.tasks.progress * 100);
  const focusPct = Math.round(stats.focus.focusProgress * 100);
  const score = stats.focusScore;

  return (
    <section
      aria-label="Stats and progress"
      className="w-full rounded-3xl p-6 sm:p-8"
      style={{
        backgroundColor: theme.surface,
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
      }}
    >
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: theme.textMuted }}
          >
            Stats & Progress
          </p>
          <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
            Daily recap and momentum
          </h2>
        </div>
        <div className="text-xs" style={{ color: theme.textMuted }}>
          {stats.goalHitToday ? "Goal hit today" : "Keep going today"}
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Daily summary */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: theme.surfaceSoft }}>
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: theme.textMuted }}
          >
            Daily summary
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">
                {stats.tasks.completed} / {stats.tasks.total || 0} tasks done
              </p>
              <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
                Focus: {focusHoursTotal} hours today
              </p>
            </div>
            <div
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                backgroundColor: theme.primarySoft,
                color: theme.text,
                border: `1px solid ${theme.border}`,
              }}
            >
              {stats.focus.pomodorosCompleted} Pomodoros
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: theme.surfaceSoft }}>
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: theme.textMuted }}
          >
            Streak
          </p>
          <div className="mt-2">
            <p className="text-3xl font-semibold tabular-nums">{stats.streak}</p>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              days in a row hitting goals
            </p>
          </div>
        </div>

        {/* Weekly chart */}
        <div className="rounded-2xl p-4 sm:col-span-2 lg:col-span-2" style={{ backgroundColor: theme.surfaceSoft }}>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: theme.textMuted }}
              >
                Weekly chart
              </p>
              <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
                Focus hours per day (last 7 days)
              </p>
            </div>
            <div className="text-xs" style={{ color: theme.textMuted }}>
              Target: {targetMinutes} min
            </div>
          </div>

          <div className="mt-4 flex h-28 items-end gap-2">
            {stats.weekly.map((b) => {
              const heightPct = b.focusMinutes / weeklyMax;
              const h = Math.max(6, Math.round(heightPct * 100));
              const hours = b.focusMinutes / 60;
              return (
                <div key={b.dateKey} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="w-full rounded-full"
                    style={{
                      height: `${h}%`,
                      background: `linear-gradient(180deg, ${theme.primarySoft}, ${theme.progressFg})`,
                      border: `1px solid ${theme.border}`,
                    }}
                    aria-label={`${b.label}: ${hours.toFixed(1)} hours`}
                    title={`${b.label}: ${hours.toFixed(1)} hours`}
                  />
                  <div className="text-[11px] font-medium" style={{ color: theme.textMuted }}>
                    {b.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Focus score */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: theme.surfaceSoft }}>
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: theme.textMuted }}
          >
            Focus score
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold tabular-nums">{score}</p>
              <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>
                Tasks: {percentTasks}% · Pomodoros: {focusPct}%
              </p>
            </div>
            <div
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                backgroundColor: theme.primarySoft,
                color: theme.text,
                border: `1px solid ${theme.border}`,
              }}
            >
              {score >= 80 ? "Excellent" : score >= 50 ? "Good" : "Building"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

