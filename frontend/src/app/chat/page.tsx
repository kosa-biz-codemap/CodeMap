"use client";

import { Suspense } from "react";
import { ChatInterface } from "@/features/chat/components/ChatInterface";
import { FileTree } from "@/features/chat/components/FileTree";

function ChatContent() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <div className="hidden md:block w-[260px] shrink-0 h-full">
        <FileTree repoName="Current Project" className="h-full border-r-0" />
      </div>
      <div className="flex-1 min-w-0 h-full">
        <ChatInterface />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]"
          style={{ background: "var(--bg-primary)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading...
          </p>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
