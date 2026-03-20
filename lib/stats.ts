export type PomodoroFocusEntry = {
  id: string;
  completedAtISO: string;
  durationMinutes: number;
};

export type StoredTodo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

export function getDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTodosStorageKey(dateKey: string) {
  return `pomodoro-todos-${dateKey}`;
}

export function getFocusStorageKey(dateKey: string) {
  return `pomodoro-focus-${dateKey}`;
}

export function calcFocusMinutes(focusEntries: PomodoroFocusEntry[]) {
  return focusEntries.reduce((sum, e) => {
    const m = Number(e.durationMinutes);
    return sum + (Number.isFinite(m) ? m : 0);
  }, 0);
}

export function calcTasksProgress(todos: StoredTodo[]) {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  if (total === 0) return { total, completed, progress: 0 };
  return { total, completed, progress: completed / total };
}

export function calcFocusProgress(
  focusMinutes: number,
  targetMinutes: number,
) {
  if (targetMinutes <= 0) return 0;
  const raw = focusMinutes / targetMinutes;
  if (raw <= 0) return 0;
  if (raw >= 1) return 1;
  return raw;
}

export function calcFocusScore({
  todos,
  focusEntries,
  targetMinutes,
}: {
  todos: StoredTodo[];
  focusEntries: PomodoroFocusEntry[];
  targetMinutes: number;
}) {
  const { progress: tasksProgress } = calcTasksProgress(todos);
  const focusMinutes = calcFocusMinutes(focusEntries);
  const focusProgress = calcFocusProgress(focusMinutes, targetMinutes);
  const score = 100 * (0.5 * tasksProgress + 0.5 * focusProgress);
  return Math.round(score);
}

export function isGoalHit({
  todos,
  focusEntries,
}: {
  todos: StoredTodo[];
  focusEntries: PomodoroFocusEntry[];
}) {
  // “All tasks completed AND at least 1 Pomodoro finished.”
  const total = todos.length;
  if (total === 0) return false;
  const completed = todos.filter((t) => t.completed).length;
  if (completed !== total) return false;
  return focusEntries.length > 0;
}

export function calcConsecutiveStreak({
  dateKeysNewestToOldest,
  goalHitByDateKey,
}: {
  dateKeysNewestToOldest: string[];
  goalHitByDateKey: Record<string, boolean>;
}) {
  let streak = 0;
  for (const key of dateKeysNewestToOldest) {
    if (goalHitByDateKey[key]) streak += 1;
    else break;
  }
  return streak;
}

export function getLastNDatesNewestFirst(n: number, now = new Date()) {
  const keys: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(getDateKey(d));
  }
  return keys;
}

