"use client";

import Clock from "@/components/Clock";
import Reward from "@/components/Reward";
import ThemeToggle from "@/components/ThemeToggle";
import TodoList from "@/components/TodoList";
import StatsAndProgress from "@/components/StatsAndProgress";
import { ThemeProvider, useTheme } from "@/lib/ThemeContext";
import { useState, useCallback } from "react";

function HomeContent() {
  const { theme } = useTheme();
  const [rewardVisible, setRewardVisible] = useState(false);
  const [rewardProgress, setRewardProgress] = useState(0);

  // ✅ Moved here — above return, outside JSX
  const onTaskCompleted = useCallback((progress: number) => {
    setTimeout(() => {
      setRewardProgress(progress);
      setRewardVisible(true);
    }, 0);
  }, []);

  return (
    <div
      className="min-h-screen w-full font-sans"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        transition:
          "background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease",
      }}
    >
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-12">
        <header className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              Quartz Pomodoro
            </p>
            <h1 className="text-2xl font-semibold sm:text-3xl">
              One screen for deep work.
            </h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Drag the clock, capture today&apos;s tasks, and let small
              sprints stack into something meaningful.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <section className="flex flex-1 flex-col gap-6 md:flex-row md:gap-8">
          <div className="md:w-1/2">
            <Clock />
          </div>
          <div className="md:w-1/2">
            {/* ✅ TodoList now correctly receives the callback as a prop */}
            <TodoList onTaskCompleted={onTaskCompleted} />
          </div>
        </section>

        <div className="mt-6">
          <StatsAndProgress />
        </div>
      </main>

      <Reward
        visible={rewardVisible}
        progress={rewardProgress}
        onClose={() => setRewardVisible(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <HomeContent />
    </ThemeProvider>
  );
}
