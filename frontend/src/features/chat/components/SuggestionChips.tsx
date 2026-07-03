"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderSearch,
  Rocket,
  Crosshair,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { useApp } from "@/common/contexts/AppContext";

interface SuggestionChipsProps {
  onSelect: (question: string) => void;
  compact?: boolean;
  disabled?: boolean;
}

const CHIP_ICONS = [
  LayoutDashboard,
  FolderSearch,
  Rocket,
  Crosshair,
  AlertTriangle,
  Layers,
];

export function SuggestionChips({ onSelect, compact = false, disabled = false }: SuggestionChipsProps) {
  const { locale, t } = useApp();

  const suggestions = t.chat.suggestions;

  return (
    <div className={`flex flex-col items-center ${compact ? "gap-3 py-2" : "gap-6 py-8"}`}>
      <div className={compact ? "w-full text-left" : "text-center"}>
        <h2
          className={`${compact ? "text-xs" : "text-lg"} font-bold mb-1`}
          style={{ color: "var(--text-primary)" }}
        >
          {compact ? (locale === "ko" ? "빠른 질문" : "Quick questions") : t.chat.empty.title}
        </h2>
        <p className={compact ? "text-[10px]" : "text-xs"} style={{ color: "var(--text-muted)" }}>
          {t.chat.empty.subtitle}
        </p>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full ${compact ? "" : "max-w-lg"}`}>
        {suggestions.map((suggestion: string, i: number) => {
          const Icon = CHIP_ICONS[i % CHIP_ICONS.length];

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!disabled) onSelect(suggestion);
              }}
              disabled={disabled}
              className={`flex items-center gap-2.5 rounded-xl text-left text-xs font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "px-3 py-2.5" : "px-4 py-3"} ${disabled ? "" : "cursor-pointer"}`}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-primary)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                if (disabled) return;
                e.currentTarget.style.borderColor = "var(--accent-blue)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                if (disabled) return;
                e.currentTarget.style.borderColor = "var(--border-primary)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={{ color: "var(--accent-blue)" }}
              />
              <span>{suggestion}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
