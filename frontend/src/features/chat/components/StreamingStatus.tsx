"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";
import { useApp } from "@/common/contexts/AppContext";
import type { StreamPhase } from "@/features/chat/api/chatApi";

interface StreamingStatusProps {
  phase: StreamPhase;
}

const PHASE_ORDER: StreamPhase[] = ["searching", "building_context", "generating"];
const THINKING_COPY = [
  "Thinking...",
  "Pondering...",
  "Vibing...",
  "Brewing...",
  "Chilling...",
  "Grooving...",
  "Assembling thoughts...",
  "Structuring...",
  "Drafting...",
  "Juicing...",
  "Refining...",
];

export function StreamingStatus({ phase }: StreamingStatusProps) {
  const { t } = useApp();
  const [copyIndex, setCopyIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCopyIndex((index) => (index + 1) % THINKING_COPY.length);
    }, 1400);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const phases = [
    { key: "searching" as const, icon: Search, label: t.chat.status.searching },
    { key: "building_context" as const, icon: BookOpen, label: t.chat.status.buildingContext },
    { key: "generating" as const, icon: Sparkles, label: t.chat.status.generating },
  ];

  const currentIndex = PHASE_ORDER.indexOf(phase);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 py-3 px-4 rounded-xl"
      style={{ background: "var(--bg-card)" }}
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <motion.span
          key={copyIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22 }}
          className="text-[11px] font-semibold"
          style={{ color: "var(--accent-blue)" }}
        >
          {THINKING_COPY[copyIndex]}
        </motion.span>
        <div className="flex gap-1">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="size-1.5 rounded-full"
              style={{ background: "var(--accent-blue)" }}
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.14 }}
            />
          ))}
        </div>
      </div>
      {phases.map((p, i) => {
        const isComplete = i < currentIndex || phase === "complete";
        const isCurrent = i === currentIndex && phase !== "complete";
        const Icon = p.icon;

        return (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2.5 text-xs"
          >
            {isComplete ? (
              <CheckCircle2
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "var(--accent-green)" }}
              />
            ) : isCurrent ? (
              <span className="relative flex w-3.5 h-3.5 items-center justify-center shrink-0">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-40"
                  style={{
                    background: "var(--accent-blue)",
                    animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                  }}
                />
                <Icon className="w-3 h-3 relative" style={{ color: "var(--accent-blue)" }} />
              </span>
            ) : (
              <Icon
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "var(--text-faint)" }}
              />
            )}
            <span
              style={{
                color: isComplete
                  ? "var(--accent-green)"
                  : isCurrent
                    ? "var(--accent-blue)"
                    : "var(--text-faint)",
                fontWeight: isCurrent ? 600 : 400,
              }}
            >
              {p.label}
              {isComplete && " ✓"}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
