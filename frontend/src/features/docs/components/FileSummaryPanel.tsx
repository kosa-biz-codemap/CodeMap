"use client";

import { useState, useMemo } from "react";
import { ChevronRight, Folder } from "lucide-react";
import type {
    DocGetJsonData,
    DocFileSummaryItem,
    DocFolderSummary,
} from "@/common/types/contracts";
import { buildFileSummaries } from "../utils/buildFileSummaries";

interface FileSummaryPanelProps {
    docData: DocGetJsonData;
}

type SelectionState =
    | { type: "file"; item: DocFileSummaryItem }
    | { type: "folder"; path: string; summary: string }
    | null;

interface FolderGroup {
    path: string;
    summary: string;
    files: DocFileSummaryItem[];
}


function buildFolderGroups(
    files: DocFileSummaryItem[],
    folderSummaries: DocFolderSummary[]
): FolderGroup[] {
    const groupMap = new Map<string, FolderGroup>();

    for (const { path, summary } of folderSummaries) {
        groupMap.set(path, { path, summary, files: [] });
    }

    for (const file of files) {
        const key = file.folderPath ?? "(루트)";
        if (!groupMap.has(key)) {
            groupMap.set(key, { path: key, summary: "", files: [] });
        }
        groupMap.get(key)!.files.push(file);
    }

    return Array.from(groupMap.values()).sort((a, b) =>
        a.path.localeCompare(b.path)
    );
}


export function FileSummaryPanel({ docData }: FileSummaryPanelProps) {
    const [query, setQuery] = useState("");
    const [selection, setSelection] = useState<SelectionState>(null);
    const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

    const files = useMemo(
        () =>
            buildFileSummaries(
                docData.readingOrder,
                docData.dangerFiles,
                docData.folderSummaries,
                docData.fileSummaries
            ),
        [docData]
    );

    const groups = useMemo(
        () => buildFolderGroups(files, docData.folderSummaries),
        [files, docData.folderSummaries]
    );

    const filteredGroups = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return groups;
        return groups
            .map((g) => ({
                ...g,
                files: g.files.filter(
                    (f) =>
                        f.path.toLowerCase().includes(q) ||
                        f.fileName.toLowerCase().includes(q)
                ),
            }))
            .filter(
                (g) =>
                    g.files.length > 0 || g.path.toLowerCase().includes(q)
            );
    }, [groups, query]);

    const toggleFolder = (path: string) => {
        setOpenFolders((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    const handleFolderClick = (g: FolderGroup) => {
        toggleFolder(g.path);
        setSelection({ type: "folder", path: g.path, summary: g.summary });
    };

    const handleFileClick = (item: DocFileSummaryItem) => {
        setSelection({ type: "file", item });
    };

    return (
        <div className="flex gap-4">
            <aside className="w-64 flex-shrink-0">
                <input
                    type="text"
                    placeholder="파일 / 폴더 검색..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
                    style={{
                        borderColor: "var(--border-primary)",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                    }}
                />
                <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
                    {filteredGroups.map((g) => {
                        const isOpen = openFolders.has(g.path);
                        const isFolderSelected =
                            selection?.type === "folder" &&
                            selection.path === g.path;
                        const folderHasReadingOrder = g.files.some(
                            (f) => f.priority != null
                        );
                        const folderColor =
                            !isOpen && folderHasReadingOrder
                                ? "#f59e0b"
                                : "var(--text-secondary)";
                        return (
                            <li key={g.path}>
                                <button
                                    type="button"
                                    onClick={() => handleFolderClick(g)}
                                    className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-white/10"
                                    style={{
                                        background: isFolderSelected
                                            ? "var(--bg-tertiary)"
                                            : undefined,
                                        color: folderColor,
                                    }}
                                >
                                    <ChevronRight
                                        className={`size-3 shrink-0 transition-transform ${
                                            isOpen ? "rotate-90" : ""
                                        }`}
                                        style={{ color: "var(--text-muted)" }}
                                    />
                                    <Folder
                                        className="size-3.5 shrink-0"
                                        style={{ color: "var(--accent-primary)" }}
                                    />
                                    <span className="truncate font-mono">
                                        {g.path}
                                    </span>
                                    {g.files.length > 0 && (
                                        <span
                                            className="ml-auto shrink-0 rounded-full px-1.5 text-[10px]"
                                            style={{
                                                background:
                                                    "color-mix(in srgb, var(--border-primary) 40%, transparent)",
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            {g.files.length}
                                        </span>
                                    )}
                                </button>
                                {isOpen && g.files.length > 0 && (
                                    <ul
                                        className="ml-5 mt-0.5 space-y-0.5 border-l pl-3"
                                        style={{
                                            borderColor: "var(--border-primary)",
                                        }}
                                    >
                                        {g.files.map((file) => {
                                            const isFileSelected =
                                                selection?.type === "file" &&
                                                selection.item.path === file.path;
                                            return (
                                                <li key={file.path}>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleFileClick(file)
                                                        }
                                                        className="w-full rounded px-2 py-1.5 text-left transition-colors hover:bg-white/10"
                                                        style={{
                                                            background: isFileSelected
                                                                ? "var(--bg-tertiary)"
                                                                : undefined,
                                                            color: file.isDanger
                                                                ? "#ef4444"
                                                                : file.priority != null
                                                                    ? "#f59e0b"
                                                                    : "var(--text-secondary)",
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {file.isDanger && (
                                                                <span
                                                                    className="text-[10px]"
                                                                    title="위험 파일"
                                                                >
                                                                    ⚠
                                                                </span>
                                                            )}
                                                            {file.priority != null && (
                                                                <span className="rounded bg-white/10 px-1 font-mono text-[10px]">
                                                                    #{file.priority}
                                                                </span>
                                                            )}
                                                            <span className="truncate text-[11px]">
                                                                {file.fileName}
                                                            </span>
                                                        </div>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                    {filteredGroups.length === 0 && (
                        <li
                            className="px-3 py-2 text-xs"
                            style={{ color: "var(--text-muted)" }}
                        >
                            검색 결과 없음
                        </li>
                    )}
                </ul>
            </aside>

            <div
                className="min-h-48 flex-1 rounded-xl border p-4"
                style={{ borderColor: "var(--border-primary)" }}
            >
                {selection == null && (
                    <p
                        className="text-sm"
                        style={{ color: "var(--text-muted)" }}
                    >
                        왼쪽 목록에서 폴더 또는 파일을 선택하면 상세 정보를
                        표시합니다.
                    </p>
                )}
                {selection?.type === "folder" && (
                    <FolderDetail
                        path={selection.path}
                        summary={selection.summary}
                    />
                )}
                {selection?.type === "file" && (
                    <FileDetail item={selection.item} />
                )}
            </div>
        </div>
    );
}


function FolderDetail({
    path,
    summary,
}: {
    path: string;
    summary: string;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Folder
                    className="size-4 shrink-0"
                    style={{ color: "var(--accent-primary)" }}
                />
                <h3
                    className="font-mono text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                >
                    {path}
                </h3>
            </div>
            <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
            >
                {summary || "이 폴더에 대한 요약 정보가 없습니다."}
            </p>
        </div>
    );
}


function FileDetail({ item }: { item: DocFileSummaryItem }) {
    return (
        <div className="space-y-4">
            <div>
                <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                >
                    {item.fileName}
                </h3>
                <p
                    className="mt-0.5 font-mono text-xs"
                    style={{ color: "var(--text-muted)" }}
                >
                    {item.path}
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {item.priority != null && (
                    <span
                        className="rounded-full border px-2.5 py-0.5 text-xs"
                        style={{
                            borderColor: "var(--border-primary)",
                            color: "var(--text-secondary)",
                        }}
                    >
                        읽기 순서 #{item.priority}
                    </span>
                )}
                {item.isDanger && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300">
                        ⚠ 위험 파일
                    </span>
                )}
            </div>

            {item.dangerReason && (
                <div>
                    <p
                        className="mb-1 text-xs font-medium"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        위험 사유
                    </p>
                    <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--text-primary)" }}
                    >
                        {item.dangerReason}
                    </p>
                </div>
            )}

            {item.summary ? (
                <div>
                    <p
                        className="mb-1 text-xs font-medium"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        파일 요약
                    </p>
                    <p
                        className="whitespace-pre-wrap text-sm leading-relaxed"
                        style={{ color: "var(--text-primary)" }}
                    >
                        {item.summary}
                    </p>
                </div>
            ) : (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    파일 요약 정보가 없습니다.
                </p>
            )}
        </div>
    );
}
