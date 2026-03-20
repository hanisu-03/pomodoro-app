'use client';

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

type Stats = {
  total: number;
  completed: number;
};

type TodoListProps = {
  onTaskCompleted?: (progress: number) => void;
  onStatsChange?: (stats: Stats & { progress: number }) => void;
};

function getTodayKey() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `pomodoro-todos-${y}-${m}-${d}`;
}

export default function TodoList({
  onTaskCompleted,
  onStatsChange,
}: TodoListProps) {
  const { theme } = useTheme();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const storageKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Todo[];
        setTodos(parsed);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(todos));
    } catch {
      // ignore
    }
  }, [storageKey, todos]);

  const stats = useMemo<Stats & { progress: number }>(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const progress = total === 0 ? 0 : completed / total;
    return { total, completed, progress };
  }, [todos]);

  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(stats);
    }
  }, [stats, onStatsChange]);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text: trimmed,
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput("");
  };

  const handleToggle = (id: string) => {
    setTodos((prev) => {
      const next = prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      );
      const before = prev.filter((t) => t.id === id)[0];
      const after = next.filter((t) => t.id === id)[0];
      if (before && after && !before.completed && after.completed) {
        const total = next.length;
        const completed = next.filter((t) => t.completed).length;
        const progress = total === 0 ? 0 : completed / total;
        if (onTaskCompleted) onTaskCompleted(progress);
      }
      return next;
    });
  };

  const handleDelete = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const handleClearCompleted = () => {
    setTodos((prev) => prev.filter((todo) => !todo.completed));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd();
    }
  };

  const percent = Math.round(stats.progress * 100);

  return (
    <section
      aria-label="Daily tasks"
      className="flex w-full flex-col gap-5 rounded-3xl p-6 sm:p-8"
      style={{
        backgroundColor: theme.surface,
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
      }}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: theme.textMuted }}
          >
            Daily Tasks
          </p>
          <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
            What are you focusing on today?
          </h2>
        </div>
        <div className="flex flex-col items-end text-right text-xs">
          <span style={{ color: theme.textMuted }}>
            {stats.completed} / {stats.total || 1} done
          </span>
          <span
            className="mt-1 rounded-full px-2 py-[2px] text-[11px] font-medium"
            style={{
              backgroundColor: theme.primarySoft,
              color: theme.text,
            }}
          >
            {percent}% complete
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl p-3 text-sm">
        <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-slate-800/40">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(90deg, ${theme.progressFg}, ${theme.accent})`,
            }}
          />
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write the one task that will move you forward..."
            className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: theme.surfaceSoft,
              borderColor: theme.border,
              color: theme.text,
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:-translate-y-[1px] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: theme.primary,
              color: "#0b1120",
            }}
          >
            Add
          </button>
        </div>
      </div>

      <ul className="flex max-h-[260px] flex-col gap-2 overflow-y-auto pr-1 text-sm">
        {todos.length === 0 && (
          <li
            className="rounded-xl px-4 py-3 text-xs"
            style={{
              backgroundColor: theme.surfaceSoft,
              color: theme.textMuted,
              border: `1px dashed ${theme.border}`,
            }}
          >
            No tasks yet. Capture the next tiny, concrete action that will
            move your main project forward.
          </li>
        )}
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 rounded-xl px-3 py-2"
            style={{
              backgroundColor: todo.completed
                ? theme.primarySoft
                : theme.surfaceSoft,
              border: `1px solid ${theme.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => handleToggle(todo.id)}
              className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold"
              style={{
                borderColor: todo.completed ? theme.primary : theme.border,
                backgroundColor: todo.completed
                  ? theme.primary
                  : theme.surface,
                color: todo.completed ? "#0b1120" : theme.textMuted,
              }}
              aria-label={
                todo.completed ? "Mark as incomplete" : "Mark as complete"
              }
            >
              {todo.completed ? "✓" : ""}
            </button>
            <p
              className="flex-1 text-sm"
              style={{
                color: theme.text,
                textDecoration: todo.completed ? "line-through" : "none",
                opacity: todo.completed ? 0.7 : 1,
              }}
            >
              {todo.text}
            </p>
            <button
              type="button"
              onClick={() => handleDelete(todo.id)}
              className="rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide"
              style={{
                backgroundColor: theme.surface,
                color: theme.textMuted,
                border: `1px solid ${theme.border}`,
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <footer className="mt-2 flex items-center justify-between gap-3 text-xs">
        <span style={{ color: theme.textMuted }}>
          Your list is stored locally and resets each day.
        </span>
        <button
          type="button"
          onClick={handleClearCompleted}
          disabled={stats.completed === 0}
          className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            backgroundColor: theme.surfaceSoft,
            color: theme.textMuted,
            border: `1px solid ${theme.border}`,
          }}
        >
          Clear completed
        </button>
      </footer>
    </section>
  );
}

