"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  BookOpen,
  FileSearch,
  Folder,
  GitBranch,
  Layers,
  List,
  LoaderCircle,
  Navigation,
  ShieldAlert,
} from "lucide-react";
import type {
  DocGetJsonData,
  DocReadingOrderItem,
  DocDangerFileItem,
} from "@/common/types/contracts";
import { FileSummaryPanel } from "./FileSummaryPanel";

// ── 탭 정의 ────────────────────────────────────────────────────

type TabId =
  | "summary"
  | "stack"
  | "readingOrder"
  | "dangerFiles"
  | "coreFlow"
  | "folderSummaries"
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
  { id: "readingOrder",    label: "읽기 순서",        icon: List        },
  { id: "dangerFiles",     label: "위험 파일",        icon: ShieldAlert },
  { id: "coreFlow",        label: "핵심 플로우",      icon: GitBranch   },
  { id: "folderSummaries", label: "폴더 요약",        icon: Folder      },
  { id: "fileSummary",     label: "파일 단위 요약",   icon: FileSearch  },
  { id: "onboardingGuide", label: "온보딩 가이드",    icon: Navigation  },
];

// ── 개별 패널 컴포넌트 ─────────────────────────────────────────

function SummaryPanel({ text }: { text: string | null }) {
  if (!text) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        요약 정보가 없습니다.
      </p>
    );
  }
  return (
    <p
      className="whitespace-pre-wrap text-sm leading-7"
      style={{ color: "var(--text-secondary)" }}
    >
      {text}
    </p>
  );
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

  const rest = items.filter(
    (item) => item.toLowerCase() !== primaryLower
  );

  const others = rest.filter((item) =>
    KNOWN_LANGUAGES.has(item.toLowerCase())
  );
  const technologies = rest.filter(
    (item) => !KNOWN_LANGUAGES.has(item.toLowerCase())
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
      {technologies.length > 0 && (
        <section>
          <h4
            className="mb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            기술 스택
          </h4>
          <div className="flex flex-wrap gap-2">
            {technologies.map((name) => (
              <StackChip key={name} name={name} />
            ))}
          </div>
        </section>
      )}
      {others.length > 0 && (
        <section>
          <h4
            className="mb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            기타 / 미분류
          </h4>
          <div className="flex flex-wrap gap-2">
            {others.map((name) => (
              <StackChip key={name} name={name} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReadingOrderPanel({ items }: { items: DocReadingOrderItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        읽기 순서 정보가 없습니다.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.path} className="flex items-start gap-3">
          <span
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
            style={{
              background:
                "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
              color: "var(--accent-primary)",
            }}
          >
            {item.rank}
          </span>
          <div className="min-w-0">
            <span
              className="break-all font-mono text-xs leading-5"
              style={{ color: "var(--text-secondary)" }}
            >
              {item.path}
            </span>
            {item.reason && (
              <p
                className="mt-0.5 text-[11px] leading-5"
                style={{ color: "var(--text-muted)" }}
              >
                {item.reason}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function DangerFilesPanel({ items }: { items: DocDangerFileItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        위험 파일이 감지되지 않았습니다.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.path} className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <span
              className="break-all font-mono text-xs leading-5"
              style={{ color: "var(--text-secondary)" }}
            >
              {item.path}
            </span>
            {item.reason && (
              <p
                className="mt-0.5 text-[11px] leading-5"
                style={{ color: "var(--text-muted)" }}
              >
                {item.reason}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
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
    <p
      className="whitespace-pre-wrap text-sm leading-7"
      style={{ color: "var(--text-secondary)" }}
    >
      {text}
    </p>
  );
}

function FolderSummariesPanel({
  items,
}: {
  items: DocGetJsonData["folderSummaries"];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        폴더 요약 정보가 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map(({ path, summary }) => (
        <li
          key={path}
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <div className="mb-1.5 flex items-center gap-2">
            <Folder
              className="size-3.5 shrink-0"
              style={{ color: "var(--accent-primary)" }}
            />
            <span
              className="truncate font-mono text-xs font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {path}
            </span>
          </div>
          <p
            className="text-xs leading-5"
            style={{ color: "var(--text-muted)" }}
          >
            {summary || "설명이 없습니다."}
          </p>
        </li>
      ))}
    </ul>
  );
}

// ── 다운로드 미리보기 전용 컴포넌트 ──────────────────────────────

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
        <LoaderCircle className="size-6 animate-spin" style={{ color: "var(--text-muted)" }} />
        <span className="ml-3 text-sm" style={{ color: "var(--text-muted)" }}>문서를 불러오는 중...</span>
      </div>
    );
  }

  if (error || !content) {
    return <p className="text-sm text-red-500">{error || "내용이 없습니다."}</p>;
  }

  return (
    <div className="prose prose-sm prose-invert max-w-none break-words [&_li]:my-0.5 [&_li>p]:my-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
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
    summary:         <SummaryPanel text={data.summary} />,
    stack:           <StackPanel items={data.stack} primaryLanguage={data.primaryLanguage} />,
    readingOrder:    <ReadingOrderPanel items={data.readingOrder} />,
    dangerFiles:     <DangerFilesPanel items={data.dangerFiles} />,
    coreFlow:        <CoreFlowPanel text={data.coreFlow} />,
    folderSummaries: <FolderSummariesPanel items={data.folderSummaries} />,
    fileSummary:     <FileSummaryPanel docData={data} />,
    onboardingGuide: (
      <MarkdownPreviewPanel
        content={markdownContent}
        isLoading={isMarkdownLoading}
        error={markdownError}
      />
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
        {/* 메타 정보 */}
        <div className="mb-4 flex items-center justify-between">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--text-muted)" }}
          >
            {TABS.find((t) => t.id === activeTab)?.label}
          </p>
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

      {/* 인쇄용 컨테이너 (평소에는 숨김, 인쇄 시 전체 문서 레이아웃으로 활성화됨) */}
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
