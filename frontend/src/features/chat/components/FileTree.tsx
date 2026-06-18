"use client";

import { useState } from "react";
import { Folder, FolderOpen, FileText, FileCode, FileImage, File, ChevronRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface FileNode {
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
  path: string;
  extension?: string;
}

const DUMMY_FILE_TREE: FileNode[] = [
  {
    name: "src",
    type: "directory",
    path: "/src",
    children: [
      {
        name: "app",
        type: "directory",
        path: "/src/app",
        children: [
          { name: "layout.tsx", type: "file", path: "/src/app/layout.tsx", extension: "tsx" },
          { name: "page.tsx", type: "file", path: "/src/app/page.tsx", extension: "tsx" },
        ],
      },
      {
        name: "features",
        type: "directory",
        path: "/src/features",
        children: [
          {
            name: "chat",
            type: "directory",
            path: "/src/features/chat",
            children: [
              { name: "ChatInterface.tsx", type: "file", path: "/src/features/chat/ChatInterface.tsx", extension: "tsx" },
              { name: "chatApi.ts", type: "file", path: "/src/features/chat/chatApi.ts", extension: "ts" },
            ],
          },
        ],
      },
      { name: "globals.css", type: "file", path: "/src/globals.css", extension: "css" },
    ],
  },
  {
    name: "public",
    type: "directory",
    path: "/public",
    children: [
      { name: "favicon.ico", type: "file", path: "/public/favicon.ico", extension: "ico" },
      { name: "logo.svg", type: "file", path: "/public/logo.svg", extension: "svg" },
    ],
  },
  { name: "package.json", type: "file", path: "/package.json", extension: "json" },
  { name: "README.md", type: "file", path: "/README.md", extension: "md" },
];

function getFileIcon(extension?: string) {
  switch (extension) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
      return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
    case "css":
      return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
    case "json":
      return <FileText className="w-4 h-4 text-yellow-400 shrink-0" />;
    case "md":
      return <FileText className="w-4 h-4 text-stone-400 shrink-0" />;
    case "svg":
    case "png":
    case "jpg":
    case "ico":
      return <FileImage className="w-4 h-4 text-purple-400 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-gray-400 shrink-0" />;
  }
}

interface TreeNodeProps {
  node: FileNode;
  level: number;
}

function TreeNode({ node, level }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(level < 1);
  const isDir = node.type === "directory";

  const toggle = () => {
    if (isDir) setIsOpen(!isOpen);
  };

  return (
    <div className="select-none">
      <div
        onClick={toggle}
        className={`flex items-center gap-1.5 px-2 py-1.5 hover:bg-zinc-800/50 rounded-md cursor-pointer text-sm transition-colors ${
          isDir ? "text-zinc-200" : "text-zinc-400 hover:text-zinc-200"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {isDir ? (
          <div className="flex items-center gap-1.5">
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-400 shrink-0" />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 ml-5">
            {getFileIcon(node.extension)}
          </div>
        )}
        <span className="truncate">{node.name}</span>
      </div>

      {isDir && (
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {node.children?.map((child) => (
                <TreeNode key={child.path} node={child} level={level + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

interface FileTreeProps {
  repoName?: string;
  className?: string;
}

export function FileTree({ repoName = "Current Project", className = "" }: FileTreeProps) {
  return (
    <div className={`flex flex-col h-full bg-zinc-950 border-r border-zinc-800 ${className}`}>
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider truncate">
          {repoName}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700">
        {DUMMY_FILE_TREE.map((node) => (
          <TreeNode key={node.path} node={node} level={0} />
        ))}
      </div>
    </div>
  );
}
