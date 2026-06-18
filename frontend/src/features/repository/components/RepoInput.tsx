"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown, Github, RefreshCw, SlidersHorizontal, Sparkles } from "lucide-react";
import { useApp } from "@/common/contexts/AppContext";

export type RepoSource = "local" | "github";

interface RepoInputProps {
  onSubmit: (input: {
    source: RepoSource;
    path: string;
    branch?: string;
    force_refresh?: boolean;
    model?: string;
  }) => void;
  disabled?: boolean;
  defaultMode?: RepoSource;
  initialPath?: string;
  initialMode?: RepoSource;
}

const GITHUB_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+?(?:\.git)?\/?$/;

export function RepoInput({
  onSubmit,
  disabled = false,
  initialPath,
}: RepoInputProps) {
  const { theme } = useApp();
  const isDark = theme === "dark";
  const [value, setValue] = useState(initialPath || "");
  const [branch, setBranch] = useState("");
  const [forceRefresh, setForceRefresh] = useState(false);
  const [touched, setTouched] = useState(false);
  const inputId = useId();
  const forceId = useId();

  const error = useMemo(() => {
    if (!touched) return null;
    if (!value.trim()) return "GitHub 저장소 URL을 입력해주세요.";
    if (!GITHUB_URL.test(value.trim())) return "https://github.com/owner/repository 형식으로 입력해주세요.";
    return null;
  }, [touched, value]);

  const inputClass = isDark
    ? "border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-600 focus:border-blue-500"
    : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500";

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (!GITHUB_URL.test(value.trim())) return;
    onSubmit({
      source: "github",
      path: value.trim(),
      branch: branch.trim() || undefined,
      force_refresh: forceRefresh,
      model: "auto",
    });
  };

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl border p-4 shadow-sm ${isDark ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-white"}`}
      noValidate
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
          <Github className="size-4 text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">새 저장소 분석</h2>
          <p className={`mt-0.5 text-[11px] leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
            공개 GitHub 저장소를 실제로 복제해 구조와 코드 근거를 분석합니다.
          </p>
        </div>
      </div>

      <label htmlFor={inputId} className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
        Repository URL
      </label>
      <input
        id={inputId}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => setTouched(true)}
        disabled={disabled}
        placeholder="https://github.com/owner/repository"
        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${inputClass}`}
      />
      {error && <p className="mt-1.5 text-[11px] font-medium text-red-400">{error}</p>}

      <details className={`group mt-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-950/40" : "border-zinc-200 bg-zinc-50"}`}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-[11px] font-semibold text-zinc-500">
          <SlidersHorizontal className="size-3.5" />
          고급 분석 설정
          <ChevronDown className="ml-auto size-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div className={`space-y-3 border-t px-3 py-3 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-500">분석 브랜치</label>
            <input
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              placeholder="기본 브랜치 자동 감지"
              disabled={disabled}
              className={`w-full rounded-lg border px-2.5 py-2 text-xs outline-none ${inputClass}`}
            />
          </div>
          <label htmlFor={forceId} className="flex cursor-pointer items-start gap-2.5">
            <input
              id={forceId}
              type="checkbox"
              checked={forceRefresh}
              onChange={(event) => setForceRefresh(event.target.checked)}
              disabled={disabled}
              className="mt-0.5 size-3.5 rounded border-zinc-600 bg-zinc-900 text-blue-500"
            />
            <span>
              <span className="block text-[11px] font-medium">새 스냅샷으로 다시 분석</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-zinc-500">
                서버에 남은 기존 clone을 삭제하고 원격 저장소를 다시 복제합니다.
              </span>
            </span>
          </label>
        </div>
      </details>

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/5 px-2.5 py-2 text-[10px] text-emerald-400">
        <Sparkles className="size-3" />
        구조 분석은 실제 파일 스캔 · 설명 모델은 서버 정책으로 자동 선택
      </div>

      <button
        type="submit"
        disabled={disabled}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-zinc-950 text-white hover:bg-zinc-800"}`}
      >
        {disabled && <RefreshCw className="size-3.5 animate-spin" />}
        {disabled ? "저장소 분석 중" : "분석 워크스페이스 만들기"}
      </button>
    </form>
  );
}
