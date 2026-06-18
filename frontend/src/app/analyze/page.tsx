"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Github,
  LoaderCircle,
  PanelRightOpen,
  Plus,
  ScanSearch,
  X,
} from "lucide-react";
import { RepoInput, type RepoSource } from "@/features/repository/components/RepoInput";
import { HistoryList } from "@/features/history/components/HistoryList";
import { WorkspaceReport } from "@/features/analysis/components/WorkspaceReport";
import { FileTree } from "@/features/chat/components/FileTree";
import { ChatInterface } from "@/features/chat/components/ChatInterface";
import { demoWorkspaceReport } from "@/features/analysis/data/demoWorkspace";
import { fetchJobStatus, startAnalysis } from "@/features/analysis/api/api";
import type { JobStatusData, WorkspaceReport as WorkspaceReportData } from "@/common/types/contracts";

type ViewStatus = "idle" | "running" | "completed" | "failed";

function AnalyzeWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preview = searchParams.get("preview") === "1";
  const queryJobId = searchParams.get("job");
  const initialPath = searchParams.get("path") || undefined;
  const [jobId, setJobId] = useState<string | null>(preview ? "preview-codemap" : queryJobId);
  const [job, setJob] = useState<JobStatusData | null>(null);
  const [report, setReport] = useState<WorkspaceReportData | null>(preview ? demoWorkspaceReport : null);
  const [status, setStatus] = useState<ViewStatus>(preview ? "completed" : queryJobId ? "running" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [showNewAnalysis, setShowNewAnalysis] = useState(!preview && !queryJobId);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatPromptNonce, setChatPromptNonce] = useState(0);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(searchParams.get("thread"));

  const loadJob = useCallback(async (id: string) => {
    try {
      const response = await fetchJobStatus(id);
      const nextJob = response.data;
      setJob(nextJob);
      if (nextJob.report) setReport(nextJob.report);
      if (nextJob.status === "COMPLETED") setStatus("completed");
      else if (nextJob.status === "FAILED") {
        setStatus("failed");
        setError(nextJob.statusMessage || "분석에 실패했습니다.");
      } else setStatus("running");
    } catch (requestError) {
      setStatus("failed");
      setError(requestError instanceof Error ? requestError.message : "분석 상태를 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    if (!queryJobId || preview) return;
    queueMicrotask(() => void loadJob(queryJobId));
  }, [loadJob, preview, queryJobId]);

  useEffect(() => {
    if (!jobId || preview || status !== "running") return;
    const timer = window.setInterval(() => void loadJob(jobId), 1400);
    return () => window.clearInterval(timer);
  }, [jobId, loadJob, preview, status]);

  const submit = async (input: {
    source: RepoSource;
    path: string;
    branch?: string;
    force_refresh?: boolean;
    model?: string;
  }) => {
    setStatus("running");
    setError(null);
    setReport(null);
    setShowNewAnalysis(false);
    try {
      const response = await startAnalysis({
        repoUrl: input.path,
        branch: input.branch,
        model: input.model || "auto",
        forceRefresh: input.force_refresh || false,
      });
      const id = response.data.jobId;
      setJobId(id);
      setJob({
        jobId: id,
        repoName: response.data.repoName,
        owner: response.data.owner,
        repoUrl: input.path,
        branch: response.data.branch,
        clonePath: "",
        status: "IN_PROGRESS",
        stage: "CLONE",
        progress: 0,
        statusMessage: "저장소 분석을 시작합니다.",
        model: response.data.model || "auto",
        report: null,
        createdAt: response.data.createdAt,
        updatedAt: response.data.createdAt,
      });
      router.replace(`/analyze?job=${id}`);
    } catch (requestError) {
      setStatus("failed");
      setShowNewAnalysis(true);
      setError(requestError instanceof Error ? requestError.message : "분석 요청에 실패했습니다.");
    }
  };

  const selectHistory = (id: string) => {
    setJobId(id);
    setReport(null);
    setError(null);
    setStatus("running");
    setShowNewAnalysis(false);
    router.replace(`/analyze?job=${id}`);
    void loadJob(id);
  };

  const ask = (prompt: string, contextFile?: string) => {
    if (contextFile) setSelectedFile(contextFile);
    setChatPrompt(prompt);
    setChatPromptNonce((value) => value + 1);
    if (window.matchMedia("(max-width: 1279px)").matches) setMobileChatOpen(true);
  };

  const repoName = report?.repository.name || job?.repoName || "새 프로젝트";
  const progress = preview ? 100 : job?.progress || 0;
  const chatRepoId = report || status === "completed" ? jobId : null;
  const fullChatUrl = preview
    ? "/chat?repo_id=preview-codemap&preview=1"
    : `/chat?repo_id=${jobId || ""}${threadId ? `&thread=${threadId}` : ""}`;

  return (
    <main className="flex h-[calc(100vh-3.5rem)] min-h-[640px] flex-col overflow-hidden bg-zinc-950 text-white">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800 px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
            <Github className="size-3.5 text-zinc-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-zinc-200">{repoName}</p>
            <p className="truncate text-[9px] text-zinc-600">{job ? `${job.owner} / ${job.branch}` : "분석과 채팅이 연결되는 저장소 워크스페이스"}</p>
          </div>
        </div>
        {status !== "idle" && (
          <div className="ml-2 hidden items-center gap-2 sm:flex">
            <span className={`size-1.5 rounded-full ${status === "completed" ? "bg-emerald-400" : status === "failed" ? "bg-red-400" : "animate-pulse bg-blue-400"}`} />
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">{status === "completed" ? "Ready" : status === "failed" ? "Failed" : `${job?.stage || "Preparing"} · ${progress}%`}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {report && <span className="hidden rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-[8px] text-zinc-600 md:inline">{preview ? "PREVIEW" : jobId?.slice(0, 8)}</span>}
          <button onClick={() => setShowNewAnalysis(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400 transition hover:bg-zinc-900 hover:text-white"><Plus className="size-3" /> 새 분석</button>
          <button onClick={() => setMobileChatOpen(true)} disabled={!chatRepoId} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-blue-400 disabled:bg-zinc-900 disabled:text-zinc-700 xl:hidden"><PanelRightOpen className="size-3" /> Copilot</button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[290px] shrink-0 border-r border-zinc-800 lg:block">
          {showNewAnalysis || !report ? (
            <div className="h-full overflow-y-auto bg-zinc-950 p-3">
              {report && <button onClick={() => setShowNewAnalysis(false)} className="mb-3 inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-white"><ChevronLeft className="size-3" /> 현재 프로젝트로 돌아가기</button>}
              <RepoInput onSubmit={submit} disabled={status === "running"} initialPath={initialPath} initialMode="github" />
              <div className="mt-3"><HistoryList onSelect={selectHistory} activeJobId={jobId} /></div>
            </div>
          ) : (
            <FileTree repoName={repoName} files={report.files} activeFile={selectedFile} onFileSelect={setSelectedFile} className="border-r-0" />
          )}
        </aside>

        <section className="min-w-0 flex-1 overflow-y-auto bg-[#0b0b0e] px-4 py-5 md:px-6 md:py-6">
          {status === "idle" && (
            <div className="mx-auto flex min-h-full max-w-4xl items-center justify-center py-10">
              <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-300"><ScanSearch className="size-3" /> Repository intelligence workspace</span>
                  <h1 className="mt-5 text-3xl font-bold leading-tight tracking-[-0.04em] md:text-4xl">분석하고, 바로 질문하고,<br /><span className="text-zinc-500">근거 코드로 돌아오세요.</span></h1>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500">리포트와 AI 채팅을 별도 서비스로 나누지 않았습니다. 하나의 저장소 스냅샷 안에서 분석 결과, 파일 탐색, 대화 출처가 계속 이어집니다.</p>
                  <button onClick={() => router.push("/analyze?preview=1")} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800">완성된 워크스페이스 미리보기 <ArrowRight className="size-3.5" /></button>
                </div>
                <div className="lg:hidden"><RepoInput onSubmit={submit} disabled={false} initialPath={initialPath} initialMode="github" /></div>
                <div className="hidden lg:block rounded-3xl border border-zinc-800 bg-zinc-900/45 p-4 shadow-2xl shadow-blue-950/10">
                  <div className="flex items-center gap-2 border-b border-zinc-800 pb-3"><span className="size-2 rounded-full bg-emerald-400" /><span className="text-[10px] font-semibold text-zinc-400">하나의 프로젝트 컨텍스트</span></div>
                  {["실제 저장소 구조 분석", "리포트에서 바로 질문", "답변 출처 파일·라인 이동", "패널과 전체 채팅 대화 유지"].map((item, index) => <div key={item} className="flex items-center gap-3 border-b border-zinc-800/70 py-3 last:border-0"><span className="flex size-6 items-center justify-center rounded-lg bg-blue-500/10 text-[9px] font-bold text-blue-400">0{index + 1}</span><span className="text-xs text-zinc-400">{item}</span><CheckCircle2 className="ml-auto size-3.5 text-emerald-500/70" /></div>)}
                </div>
              </div>
            </div>
          )}

          {status === "running" && (
            <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center">
              <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/55 p-6 shadow-xl">
                <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10"><LoaderCircle className="size-5 animate-spin text-blue-400" /></div><div><h2 className="text-sm font-bold">{job?.statusMessage || "저장소 분석 준비 중"}</h2><p className="mt-1 text-[10px] text-zinc-500">실제 저장소를 복제하고 구조적 근거를 수집하고 있습니다.</p></div><span className="ml-auto font-mono text-xs font-bold text-blue-400">{progress}%</span></div>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500" style={{ width: `${Math.max(4, progress)}%` }} /></div>
                <div className="mt-5 grid grid-cols-4 gap-2 text-center text-[9px] font-semibold text-zinc-600">{["Clone", "Code map", "Guide", "Report"].map((step, index) => <div key={step} className={progress >= [5, 28, 72, 95][index] ? "text-blue-400" : ""}>{step}</div>)}</div>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="mx-auto flex min-h-full max-w-xl items-center justify-center"><div className="w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center"><AlertTriangle className="mx-auto size-6 text-red-400" /><h2 className="mt-3 text-sm font-bold">분석을 완료하지 못했습니다</h2><p className="mt-2 text-xs leading-5 text-zinc-500">{error}</p><button onClick={() => setShowNewAnalysis(true)} className="mt-5 rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-black">입력 확인하기</button></div></div>
          )}

          {status === "completed" && report && <WorkspaceReport report={report} preview={preview} onAsk={ask} onFileSelect={setSelectedFile} />}
        </section>

        <aside className="hidden w-[400px] shrink-0 border-l border-zinc-800 xl:block">
          <ChatInterface
            repoId={chatRepoId}
            repoName={repoName}
            threadId={threadId}
            compact
            preview={preview}
            contextFile={selectedFile}
            initialPrompt={chatPrompt}
            initialPromptKey={chatPromptNonce}
            onThreadChange={setThreadId}
            onReferenceClick={(file) => setSelectedFile(file)}
            expandHref={fullChatUrl}
          />
        </aside>
      </div>

      {mobileChatOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm xl:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileChatOpen(false); }}>
          <div className="absolute inset-y-0 right-0 w-full max-w-[430px] border-l border-zinc-800 bg-zinc-950 shadow-2xl">
            <button onClick={() => setMobileChatOpen(false)} className="absolute right-2 top-2 z-10 rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white"><X className="size-4" /></button>
            <ChatInterface repoId={chatRepoId} repoName={repoName} threadId={threadId} compact preview={preview} contextFile={selectedFile} initialPrompt={chatPrompt} initialPromptKey={chatPromptNonce} onThreadChange={setThreadId} onReferenceClick={(file) => setSelectedFile(file)} expandHref={fullChatUrl} />
          </div>
        </div>
      )}
    </main>
  );
}

export default function AnalyzePage() {
  return <Suspense fallback={<div className="h-[calc(100vh-3.5rem)] bg-zinc-950" />}><AnalyzeWorkspace /></Suspense>;
}
