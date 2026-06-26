"use client";

import { Download } from "lucide-react";
import { buildMarkdownDownloadUrl } from "@/features/docs/api/docsApi";

export interface ExportButtonsProps {
  repoId: string | null;
}

export function ExportButtons({ repoId }: ExportButtonsProps) {
  const handleMarkdownDownload = () => {
    if (!repoId) return;
    const url = buildMarkdownDownloadUrl(repoId);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={!repoId}
        onClick={handleMarkdownDownload}
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          borderColor: "var(--border-primary)",
          color: "var(--text-secondary)",
        }}
      >
        <Download className="size-3.5" />
        Markdown 다운로드
      </button>
    </div>
  );
}
