"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  BookOpen,
  FileSearch,
  GitBranch,
  Layers,
  LoaderCircle,
  Navigation,
} from "lucide-react";
import type { DocGetJsonData } from "@/common/types/contracts";
import { FileSummaryPanel } from "./FileSummaryPanel";

// ── 탭 정의 ────────────────────────────────────────────────────

type TabId =
  | "summary"
  | "stack"
  | "coreFlow"
  | "fileSummary"
  | "onboardingGuide";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: "summary",         label: "프로젝트 요약",   icon: BookOpen    },
  { id: "stack",           label: "기술 스택",        icon: Layers      },
  { id: "coreFlow",        label: "핵심 플로우",      icon: GitBranch   },
  { id: "fileSummary",     label: "파일 단위 요약",   icon: FileSearch  },
  { id: "onboardingGuide", label: "온보딩 가이드",    icon: Navigation  },
];

// ── 공통 마크다운 렌더러 ─────────────────────────────────────────

function MdText({ text }: { text: string }) {
  return (
    <div
      className={[
        "prose prose-sm prose-invert max-w-none break-words",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        "[&_p]:text-sm [&_p]:leading-7",
        "[&_h1]:text-sm [&_h1]:font-bold [&_h1]:mb-1 [&_h1]:mt-3",
        "[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-1 [&_h2]:mt-3",
        "[&_h3]:text-xs [&_h3]:font-semibold [&_h3]:mb-0.5 [&_h3]:mt-2",
        "[&_li]:text-sm [&_li]:my-0.5 [&_li>p]:my-0",
        "[&_code]:text-xs [&_pre]:text-xs",
      ].join(" ")}
      style={{ color: "var(--text-secondary)" }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

// ── 개별 패널 컴포넌트 ─────────────────────────────────────────

function cleanSummaryText(text: string, repoName: string): string {
  const lines = text.split("\n");
  let startIdx = 0;

  const firstLine = lines[0]?.trim() ?? "";
  const normalized = firstLine
    .replace(/^#+\s*/, "")
    .replace(/^\*+|\*+$/g, "")
    .trim();
  if (normalized.toLowerCase() === repoName.toLowerCase()) {
    startIdx = 1;
    while (startIdx < lines.length && lines[startIdx].trim() === "") {
      startIdx++;
    }
  }

  return lines
    .slice(startIdx)
    .filter((line) => !/^기술\s*스택\s*:/.test(line.trim()))
    .join("\n")
    .trim();
}

function SummaryPanel({
  text,
  repoName,
}: {
  text: string | null;
  repoName: string;
}) {
  if (!text) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        요약 정보가 없습니다.
      </p>
    );
  }
  return <MdText text={cleanSummaryText(text, repoName)} />;
}

const KNOWN_LANGUAGES = new Set([
  "python", "javascript", "typescript", "java", "go", "rust",
  "c++", "c#", "c", "ruby", "php", "swift", "kotlin", "scala",
  "dart", "elixir", "haskell", "lua", "r", "matlab", "julia",
]);

function StackChip({
  name,
  highlight,
}: {
  name: string;
  highlight?: boolean;
}) {
  return (
    <span
      className="rounded-full border px-3 py-1 text-xs font-medium"
      style={
        highlight
          ? {
              borderColor: "var(--accent-primary)",
              color: "var(--accent-primary)",
              background:
                "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
            }
          : {
              borderColor: "var(--border-primary)",
              color: "var(--text-secondary)",
            }
      }
    >
      {name}
    </span>
  );
}

function StackPanel({
  items,
  primaryLanguage,
}: {
  items: string[];
  primaryLanguage: string | null;
}) {
  const primary = primaryLanguage?.trim() || null;
  const primaryLower = primary?.toLowerCase() ?? "";
  const rest = items.filter((item) => item.toLowerCase() !== primaryLower);
  const techItems = rest.filter(
    (item) => !KNOWN_LANGUAGES.has(item.toLowerCase())
  );
  const otherLangs = rest.filter((item) =>
    KNOWN_LANGUAGES.has(item.toLowerCase())
  );
  const hasAny = primary || rest.length > 0;

  if (!hasAny) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        기술 스택 정보가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {primary && (
        <section>
          <h4
            className="mb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            주 언어
          </h4>
          <div className="flex flex-wrap gap-2">
            <StackChip name={primary} highlight />
          </div>
        </section>
      )}
      {techItems.length > 0 && (
        <section>
          <h4
            className="mb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            기술 스택
          </h4>
          <div className="flex flex-wrap gap-2">
            {techItems.map((name) => (
              <StackChip key={name} name={name} />
            ))}
          </div>
        </section>
      )}
      {otherLangs.length > 0 && (
        <section>
          <h4
            className="mb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            기타 / 미분류
          </h4>
          <div className="flex flex-wrap gap-2">
            {otherLangs.map((name) => (
              <StackChip key={name} name={name} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


function normalizeEntrypoints(text: string): string {
  let result = text;
  // 1. "## 핵심 실행 플로우" 헤딩 제거
  result = result.replace(/^##[ \t]+핵심[ \t]*실행[ \t]*플로우[ \t]*\n?/m, "");
  result = result.replace(/^\n+/, "");
  // 2. "진입점: a, b, c" → 번호 목록
  result = result.replace(
    /^진입점:\s*(.+)$/m,
    (_match, csv: string) => {
      const files = csv.split(",").map((s) => s.trim()).filter(Boolean);
      const list = files.map((f, i) => `${i + 1}. ${f}`).join("\n");
      return `**진입점**\n\n${list}`;
    }
  );
  // 3. standalone "진입점)" → "**진입점**" (괄호 제거)
  result = result.replace(/^진입점\)$/m, "**진입점**");
  // 4. **진입점** 바로 다음 번호 목록 앞에 빈 줄 보장
  result = result.replace(/(\*\*진입점\*\*)\n(\d+\.)/m, "$1\n\n$2");
  return result.trim();
}

function CoreFlowPanel({ text }: { text: string | null }) {
  if (!text) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        핵심 플로우 정보가 없습니다.
      </p>
    );
  }
  return (
    <div
      className={[
        "prose prose-sm prose-invert max-w-none break-words",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        "[&_p]:text-sm [&_p]:leading-7",
        "[&_h1]:text-sm [&_h1]:font-bold [&_h1]:mb-1 [&_h1]:mt-3",
        "[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-1 [&_h2]:mt-3",
        "[&_h3]:text-xs [&_h3]:font-semibold [&_h3]:mb-0.5 [&_h3]:mt-2",
        "[&_li]:text-sm [&_li]:my-0.5 [&_li>p]:my-0",
        "[&_code]:text-xs [&_pre]:text-xs",
      ].join(" ")}
      style={{ color: "var(--text-secondary)" }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ol: ({ node: _node, ...props }) => (
            <ol
              {...props}
              className="[&>li::marker]:font-bold [&>li::marker]:text-green-400"
            />
          ),
        }}
      >
        {normalizeEntrypoints(text)}
      </ReactMarkdown>
    </div>
  );
}


// ── 첫 기여 추천 작업 카드 ─────────────────────────────────────────

function FirstTasksSection({
  tasks,
}: {
  tasks: { title: string; difficulty: string }[];
}) {
  if (!tasks.length) return null;
  return (
    <div className="mb-6 space-y-3">
      <h3
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        첫 기여 추천 작업
      </h3>
      <div className="space-y-2">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              {task.title}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              난이도: {task.difficulty}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 온보딩 가이드 미리보기 전용 ──────────────────────────────────

function MarkdownPreviewPanel({
  content,
  isLoading,
  error,
}: {
  content: string | null;
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoaderCircle
          className="size-6 animate-spin"
          style={{ color: "var(--text-muted)" }}
        />
        <span className="ml-3 text-sm" style={{ color: "var(--text-muted)" }}>
          문서를 불러오는 중...
        </span>
      </div>
    );
  }

  if (error || !content) {
    return (
      <p className="text-sm text-red-500">{error || "내용이 없습니다."}</p>
    );
  }

  return (
    <div className="prose prose-sm prose-invert max-w-none break-words [&_li]:my-0.5 [&_li>p]:my-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────

export interface GuideViewerProps {
  data: DocGetJsonData | null;
  isLoading: boolean;
  error: string | null;
  markdownContent?: string | null;
  markdownError?: string | null;
  isMarkdownLoading?: boolean;
  onLoadMarkdown?: () => Promise<{ content: string; repoName: string } | null>;
}

export function GuideViewer({
  data,
  isLoading,
  error,
  markdownContent = null,
  markdownError = null,
  isMarkdownLoading = false,
  onLoadMarkdown,
}: GuideViewerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("summary");

  useEffect(() => {
    if (
      activeTab === "onboardingGuide" &&
      !markdownContent &&
      !markdownError &&
      !isMarkdownLoading
    ) {
      void onLoadMarkdown?.();
    }
  }, [activeTab, isMarkdownLoading, markdownContent, markdownError, onLoadMarkdown]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoaderCircle
          className="size-6 animate-spin"
          style={{ color: "var(--text-muted)" }}
        />
        <span className="ml-3 text-sm" style={{ color: "var(--text-muted)" }}>
          가이드북을 불러오는 중...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-400">
              가이드북을 불러오지 못했습니다
            </p>
            <p className="mt-1 text-xs text-red-400/70">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="rounded-2xl border border-dashed p-8 text-center"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <BookOpen
          className="mx-auto size-8 opacity-30"
          style={{ color: "var(--text-muted)" }}
        />
        <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
          URL에 <code className="font-mono text-xs">?repo_id=</code> 파라미터를
          전달하면 온보딩 가이드북이 표시됩니다.
        </p>
      </div>
    );
  }

  const panelContent: Record<TabId, React.ReactNode> = {
    summary:         <SummaryPanel text={data.summary} repoName={data.repoName} />,
    stack:           <StackPanel items={data.stack} primaryLanguage={data.primaryLanguage} />,
    coreFlow:        <CoreFlowPanel text={data.coreFlow} />,
    fileSummary:     <FileSummaryPanel docData={data} />,
    onboardingGuide: (
      <>
        <FirstTasksSection tasks={data.firstTasks ?? []} />
        <MarkdownPreviewPanel
          content={markdownContent}
          isLoading={isMarkdownLoading}
          error={markdownError}
        />
      </>
    ),
  };

  return (
    <>
      <article
        className="rounded-2xl border print:hidden"
        style={{ borderColor: "var(--border-primary)" }}
      >
        {/* 탭 바 */}
        <div
          className="flex overflow-x-auto border-b"
          style={{ borderColor: "var(--border-primary)" }}
          role="tablist"
          aria-label="가이드북 섹션"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${id}`}
                onClick={() => setActiveTab(id)}
                className="flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-medium transition-colors"
                style={{
                  borderBottomColor: isActive
                    ? "var(--accent-primary)"
                    : "transparent",
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* 탭 패널 */}
        <div id={`panel-${activeTab}`} role="tabpanel" className="p-6">
          {/* 버전 / 생성일 배지 */}
          <div className="mb-4 flex justify-end">
            <span
              className="rounded-full border px-2 py-0.5 text-[10px]"
              style={{
                borderColor: "var(--border-primary)",
                color: "var(--text-muted)",
              }}
            >
              v{data.version} ·{" "}
              {new Date(data.generatedAt).toLocaleDateString("ko-KR")}
            </span>
          </div>

          {panelContent[activeTab]}
        </div>
      </article>

      {/* 인쇄용 컨테이너 */}
      <div className="hidden print:block w-full text-black bg-white">
        <MarkdownPreviewPanel
          content={markdownContent}
          isLoading={isMarkdownLoading}
          error={markdownError}
        />
      </div>
    </>
  );
}
