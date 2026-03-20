'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { getDateKey, getFocusStorageKey, PomodoroFocusEntry } from "@/lib/stats";

const MIN_DURATION = 5;
const MAX_DURATION = 60;

function clampDuration(minutes: number) {
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, minutes));
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Clock() {
  const { theme } = useTheme();
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const clockRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const lastLoggedSessionIdRef = useRef<string | null>(null);
  const activeDurationMinutesRef = useRef<number>(25);

  useEffect(() => {
    setRemainingSeconds(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;
    const id = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [isRunning, remainingSeconds]);

  const handleStartPause = () => {
    const startSession = () => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      sessionIdRef.current = id;
      activeDurationMinutesRef.current = durationMinutes;
      setIsRunning(true);
    };

    if (remainingSeconds <= 0) {
      setRemainingSeconds(durationMinutes * 60);
      startSession();
      return;
    }

    if (!isRunning) {
      startSession();
      return;
    }

    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    sessionIdRef.current = null;
    activeDurationMinutesRef.current = durationMinutes;
    setRemainingSeconds(durationMinutes * 60);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    const angle = Math.atan2(dy, dx);
    let deg = (angle * 180) / Math.PI;
    deg = (deg + 90 + 360) % 360;
    const minutes = clampDuration(Math.round(deg / 6) || MIN_DURATION);
    setDurationMinutes(minutes);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (event: MouseEvent | TouchEvent) => {
      if ("touches" in event && event.touches.length > 0) {
        const t = event.touches[0];
        handlePointerMove(t.clientX, t.clientY);
      } else if ("clientX" in event) {
        handlePointerMove(event.clientX, event.clientY);
      }
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging]);

  const minuteAngle = useMemo(
    () => ((durationMinutes % 60) / 60) * 360,
    [durationMinutes],
  );

  const secondAngle = useMemo(
    () => ((remainingSeconds % 60) / 60) * 360,
    [remainingSeconds],
  );

  const progress =
    remainingSeconds > 0 ? 1 - remainingSeconds / (durationMinutes * 60) : 1;

  // Log focus completion exactly once per "run" session.
  useEffect(() => {
    if (!isRunning) return;
    if (remainingSeconds !== 0) return;

    const sid = sessionIdRef.current;
    if (!sid) return;
    if (lastLoggedSessionIdRef.current === sid) return;

    lastLoggedSessionIdRef.current = sid;

    const dateKey = getDateKey(new Date());
    const key = getFocusStorageKey(dateKey);

    try {
      const raw = window.localStorage.getItem(key);
      let entries: PomodoroFocusEntry[] = [];

      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          entries = (parsed as PomodoroFocusEntry[]).filter((e) => {
            return (
              e &&
              typeof e === "object" &&
              typeof (e as PomodoroFocusEntry).id === "string" &&
              typeof (e as PomodoroFocusEntry).completedAtISO === "string" &&
              typeof (e as PomodoroFocusEntry).durationMinutes === "number"
            );
          });
        }
      }

      const alreadyExists = entries.some((e) => e.id === sid);
      if (!alreadyExists) {
        entries.push({
          id: sid,
          completedAtISO: new Date().toISOString(),
          durationMinutes: activeDurationMinutesRef.current,
        });
        window.localStorage.setItem(key, JSON.stringify(entries));
      }
    } catch {
      // ignore localStorage errors
    }
  }, [isRunning, remainingSeconds]);

  return (
    <section
      aria-label="Pomodoro clock"
      className="flex w-full flex-col items-center gap-6 rounded-3xl p-6 sm:p-8"
      style={{
        background: `radial-gradient(circle at top, ${theme.primarySoft}, ${theme.surface})`,
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div className="flex w-full items-center justify-between gap-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: theme.textMuted }}
          >
            Analog Pomodoro
          </p>
          <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
            Set your next focus sprint
          </h2>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: theme.surfaceSoft,
            color: theme.textMuted,
            border: `1px solid ${theme.border}`,
          }}
        >
          {durationMinutes} min
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-6 sm:flex-row">
        <div className="flex flex-1 items-center justify-center">
          <div
            ref={clockRef}
            className="relative h-56 w-56 cursor-grab touch-none active:cursor-grabbing sm:h-64 sm:w-64"
          >
            {/* FIX: removed overflow-hidden so hands are never clipped */}

            {/* Clock face background */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: theme.clockFace,
                boxShadow: theme.shadow,
                border: `1px solid ${theme.border}`,
              }}
            />

            {/* FIX 3: Bolder tick marks + FIX 2: Hour numbers (12, 3, 6, 9) */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {Array.from({ length: 60 }).map((_, i) => {
                const isMajor = i % 5 === 0;
                const t = (i / 60) * Math.PI * 2;
                const a = t - Math.PI / 2;
                // FIX 3: increased rOuter and len for bolder ticks
                const rOuter = 40;
                const len = isMajor ? 10 : 5;
                const rInner = rOuter - len;

                const fmt = (n: number) => n.toFixed(3);

                const x1 = fmt(50 + Math.cos(a) * rInner);
                const y1 = fmt(50 + Math.sin(a) * rInner);
                const x2 = fmt(50 + Math.cos(a) * rOuter);
                const y2 = fmt(50 + Math.sin(a) * rOuter);

                const stroke = isMajor ? theme.text : theme.border;

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={stroke}
                    strokeOpacity={isMajor ? 0.9 : 0.6}
                    strokeWidth={isMajor ? 2 : 1}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* FIX 2: Hour numbers */}
              {[
                { label: "12", x: 50, y: 10 },
                { label: "3",  x: 90, y: 52 },
                { label: "6",  x: 50, y: 93 },
                { label: "9",  x: 10, y: 52 },
              ].map(({ label, x, y }) => (
                <text
                  key={label}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fontWeight="600"
                  fill={theme.text}
                  fillOpacity={0.8}
                >
                  {label}
                </text>
              ))}
            </svg>

            {/* FIX 1: Seconds hand — now pivots from center */}
            <div
              className="absolute left-1/2 top-1/2 h-[45%] w-px rounded-full"
              style={{
                transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
                transformOrigin: "50% 100%",
                backgroundColor:
                  theme.name === "focus" ? "#fbbf24" : "#ef4444",
                boxShadow: "0 0 6px rgba(248,250,252,0.8)",
              }}
            >
              <span
                className="absolute left-1/2 top-0 h-[6px] w-[6px] -translate-x-1/2 rounded-full"
                style={{
                  backgroundColor:
                    theme.name === "focus" ? "#fbbf24" : "#ef4444",
                }}
              />
            </div>

            {/* FIX 4: Minute hand — slightly thicker */}
            <button
              type="button"
              aria-label="Drag to set minutes"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDragging(true);
                handlePointerMove(e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                const t = e.touches[0];
                setIsDragging(true);
                handlePointerMove(t.clientX, t.clientY);
              }}
              className="absolute left-1/2 top-1/2 h-[42%] w-[4px] rounded-full"
              style={{
                transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
                transformOrigin: "50% 100%",
                background: `linear-gradient(to top, ${theme.clockHand}, ${theme.accent})`,
                boxShadow: `0 0 16px ${theme.clockHand}`,
              }}
            >
              <span
                className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.surface,
                  boxShadow: `0 0 10px ${theme.primary}`,
                }}
              />
            </button>

            {/* FIX 5: Center dot — bigger and solid */}
            <div
              className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: theme.primary,
                boxShadow: `0 0 10px ${theme.primarySoft}`,
              }}
            />

            {/* Progress ring */}
            <div className="absolute inset-[12%] rounded-full border border-transparent">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full"
                style={{
                  transform: "rotate(-90deg)",
                  overflow: "visible",
                }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke={theme.progressBg}
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke={theme.progressFg}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={(1 - progress) * 2 * Math.PI * 44}
                  style={{ transition: "stroke-dashoffset 0.4s ease" }}
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-4 sm:items-start">
          <div className="text-center sm:text-left">
            <p
              className="text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: theme.textMuted }}
            >
              Remaining
            </p>
            <p className="mt-1 text-4xl font-semibold tabular-nums sm:text-5xl">
              {formatTime(remainingSeconds)}
            </p>
          </div>

          <p
            className="max-w-xs text-sm"
            style={{ color: theme.textMuted }}
          >
            Drag the minute hand to set your Pomodoro duration between{" "}
            {MIN_DURATION} and {MAX_DURATION} minutes. Hit start and stay
            with one task until the bell.
          </p>

          <div className="mt-2 flex w-full flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleStartPause}
              className="flex-1 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide shadow-sm transition-all hover:-translate-y-[1px] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: theme.primary,
                color: "#0b1120",
              }}
            >
              {isRunning ? "Pause" : remainingSeconds === 0 ? "Restart" : "Start"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide"
              style={{
                backgroundColor: theme.surfaceSoft,
                color: theme.textMuted,
                border: `1px solid ${theme.border}`,
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
