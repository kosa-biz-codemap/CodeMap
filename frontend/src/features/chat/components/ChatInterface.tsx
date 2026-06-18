"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Expand, LockKeyhole, MessageSquareText, Send, Trash2 } from "lucide-react";
import { ModeSelector } from "./ModeSelector";
import { SuggestionChips } from "./SuggestionChips";
import { ChatMessageBubble } from "./ChatMessage";
import { StreamingStatus } from "./StreamingStatus";
import {
  fetchThread,
  previewStream,
  streamChat,
  type ChatMessage,
  type ChatMode,
  type StreamPhase,
} from "@/features/chat/api/chatApi";

interface ChatInterfaceProps {
  repoId?: string | null;
  repoName?: string;
  threadId?: string | null;
  compact?: boolean;
  preview?: boolean;
  initialPrompt?: string;
  initialPromptKey?: number;
  contextFile?: string | null;
  onThreadChange?: (threadId: string) => void;
  onReferenceClick?: (file: string, line: number) => void;
  expandHref?: string;
}

export function ChatInterface({
  repoId,
  repoName = "현재 프로젝트",
  threadId,
  compact = false,
  preview = false,
  initialPrompt,
  initialPromptKey,
  contextFile,
  onThreadChange,
  onReferenceClick,
  expandHref,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("quick");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamPhase, setStreamPhase] = useState<StreamPhase | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(threadId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!repoId) return;
    let cancelled = false;
    const hydrate = async () => {
      if (threadId && !preview) {
        const stored = await fetchThread(repoId, threadId);
        if (!cancelled && stored.length) {
          setMessages(stored);
          return;
        }
      }
      const local = window.localStorage.getItem(`codemap-chat:${repoId}`);
      if (!cancelled && local) {
        try {
          setMessages(JSON.parse(local) as ChatMessage[]);
        } catch {
          window.localStorage.removeItem(`codemap-chat:${repoId}`);
        }
      }
    };
    void hydrate();
    return () => { cancelled = true; };
  }, [preview, repoId, threadId]);

  useEffect(() => {
    if (repoId && messages.length) {
      window.localStorage.setItem(`codemap-chat:${repoId}`, JSON.stringify(messages.slice(-80)));
    }
  }, [messages, repoId]);

  useEffect(() => {
    if (!initialPrompt) return;
    const frame = requestAnimationFrame(() => {
      setInput(initialPrompt);
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [initialPrompt, initialPromptKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamPhase]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, compact ? 112 : 160)}px`;
  };

  const handleSend = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isStreaming || !repoId) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), role: "user", content, timestamp: Date.now(), mode,
    };
    const assistantId = crypto.randomUUID();
    setMessages((current) => [...current, userMessage, {
      id: assistantId, role: "assistant", content: "", timestamp: Date.now(), mode,
    }]);
    setInput("");
    setIsStreaming(true);
    setStreamPhase(null);
    if (inputRef.current) inputRef.current.style.height = "auto";

    const stream = preview
      ? previewStream(content)
      : streamChat(repoId, content, mode, { threadId: activeThreadId, contextFile });
    try {
      for await (const event of stream) {
        if (event.type === "status" && event.phase) setStreamPhase(event.phase);
        if (event.type === "thread" && event.threadId) {
          setActiveThreadId(event.threadId);
          onThreadChange?.(event.threadId);
        }
        if (event.type === "exploration" && event.step) {
          setMessages((current) => current.map((message) => message.id === assistantId
            ? { ...message, explorationSteps: [...(message.explorationSteps || []), event.step!] }
            : message));
        }
        if (event.type === "content" && event.content) {
          setMessages((current) => current.map((message) => message.id === assistantId
            ? { ...message, content: message.content + event.content }
            : message));
        }
        if (event.type === "references" && event.references) {
          setMessages((current) => current.map((message) => message.id === assistantId
            ? { ...message, references: event.references }
            : message));
        }
        if (event.type === "error") {
          setMessages((current) => current.map((message) => message.id === assistantId
            ? { ...message, content: `⚠️ ${event.error || "응답을 생성하지 못했습니다."}` }
            : message));
        }
        if (event.type === "done") setStreamPhase("complete");
      }
    } finally {
      setIsStreaming(false);
      window.setTimeout(() => setStreamPhase(null), 900);
    }
  }, [activeThreadId, contextFile, input, isStreaming, mode, onThreadChange, preview, repoId]);

  const clearMessages = () => {
    if (isStreaming) return;
    setMessages([]);
    setActiveThreadId(null);
    if (repoId) window.localStorage.removeItem(`codemap-chat:${repoId}`);
  };

  const exportConversation = () => {
    if (!messages.length) return;
    const body = messages.map((message) => `### ${message.role === "user" ? "User" : "CodeMap Copilot"}\n\n${message.content}`).join("\n\n---\n\n");
    const blob = new Blob([`# ${repoName} conversation\n\n${body}`], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${repoName.replace(/[^a-z0-9-_]/gi, "-")}-chat.md`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!repoId) {
    return (
      <section className="flex h-full flex-col bg-zinc-950">
        <div className="border-b border-zinc-800 px-4 py-3"><p className="text-xs font-bold text-zinc-200">CodeMap Copilot</p></div>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900"><LockKeyhole className="size-4 text-zinc-500" /></div>
          <p className="mt-4 text-xs font-semibold text-zinc-300">분석할 저장소를 먼저 선택하세요</p>
          <p className="mt-1.5 text-[10px] leading-5 text-zinc-600">분석 결과와 실제 파일을 공유하는 프로젝트 전용 채팅이 열립니다.</p>
        </div>
      </section>
    );
  }

  const empty = messages.length === 0;
  return (
    <section className={`flex h-full min-h-0 flex-col bg-zinc-950 text-white ${compact ? "" : "h-[calc(100vh-3.5rem)]"}`}>
      <header className="shrink-0 border-b border-zinc-800 px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2"><MessageSquareText className="size-3.5 shrink-0 text-blue-400" /><h2 className="truncate text-xs font-bold">CodeMap Copilot</h2>{preview && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold text-amber-400">PREVIEW</span>}</div>
          <div className="flex items-center gap-1">
          {expandHref && <Link href={expandHref} className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white" title="전체 화면" aria-label="전체 화면"><Expand className="size-3.5" /></Link>}
          <button onClick={exportConversation} disabled={empty} className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:opacity-25" title="Markdown 내보내기"><Download className="size-3.5" /></button>
          <button onClick={clearMessages} disabled={empty || isStreaming} className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:opacity-25" title="대화 지우기"><Trash2 className="size-3.5" /></button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <ModeSelector mode={mode} onChange={setMode} disabled={isStreaming} />
          <p className="min-w-0 flex-1 truncate text-right text-[9px] text-zinc-600">{contextFile ? `Context: ${contextFile}` : repoName}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3.5 py-4">
        <div className={`mx-auto flex flex-col gap-6 ${compact ? "max-w-xl" : "max-w-3xl"}`}>
          <AnimatePresence mode="wait">
            {empty ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-5 rounded-xl border border-blue-500/15 bg-blue-500/5 p-3">
                  <p className="text-[11px] font-semibold text-blue-300">분석과 같은 컨텍스트를 사용합니다</p>
                  <p className="mt-1 text-[10px] leading-5 text-zinc-500">리포트의 파일·위험 신호·권장사항을 질문하면 실제 코드 출처와 함께 답합니다.</p>
                </div>
                <SuggestionChips onSelect={(question) => void handleSend(question)} />
              </motion.div>
            ) : (
              <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                {messages.map((message, index) => (
                  <ChatMessageBubble
                    key={message.id}
                    message={message}
                    isStreaming={isStreaming && message.role === "assistant" && index === messages.length - 1}
                    onReferenceClick={onReferenceClick}
                  />
                ))}
                {isStreaming && streamPhase && streamPhase !== "complete" && <div className="pl-10"><StreamingStatus phase={streamPhase} /></div>}
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="shrink-0 border-t border-zinc-800 px-3.5 py-3">
        <div className={`mx-auto flex items-end gap-2 ${compact ? "max-w-xl" : "max-w-3xl"}`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSend(); } }}
            placeholder="이 코드베이스에 대해 질문하세요"
            disabled={isStreaming}
            rows={1}
            className="max-h-40 min-h-10 flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-blue-500/60"
          />
          <button onClick={() => void handleSend()} disabled={!input.trim() || isStreaming} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition hover:bg-blue-400 disabled:bg-zinc-900 disabled:text-zinc-700"><Send className="size-4" /></button>
        </div>
        <p className="mt-1.5 text-center text-[8px] text-zinc-700">답변의 파일·라인 출처를 확인한 뒤 중요한 변경을 적용하세요.</p>
      </footer>
    </section>
  );
}
