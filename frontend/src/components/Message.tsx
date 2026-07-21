import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import { FiCopy, FiCheck } from "react-icons/fi";
import { LuPencilLine } from "react-icons/lu";

import TypingIndicator from "./ui/typing-indicator";
import type { Message as MessageType } from "@/types";

interface MessageProps {
  msg: MessageType;
  onEdit?: (messageId: string | number, newContent: string) => void;
}

const LANG_MAP: Record<string, string> = {
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", tsx: "typescript", mts: "typescript", cts: "typescript",
  py: "python", rb: "ruby", rs: "rust", go: "go",
  sh: "bash", bash: "bash", zsh: "bash", shell: "bash",
  yml: "yaml", yaml: "yaml", md: "markdown",
  css: "css", scss: "scss", less: "less",
  json: "json", xml: "xml", sql: "sql",
  graphql: "graphql", gql: "graphql", php: "php",
  swift: "swift", kt: "kotlin", kotlin: "kotlin",
  c: "c", cpp: "cpp", h: "c", hpp: "cpp",
  java: "java", scala: "scala",
  pl: "perl", pas: "pascal", lua: "lua", r: "r",
  docker: "dockerfile", dockerfile: "dockerfile",
  http: "http", https: "http",
};

const CodeBlock = ({ code, lang }: { code: string; lang: string }) => {
  const resolvedLang = LANG_MAP[lang] || lang;
  let html: string;

  try {
    if (hljs.getLanguage(resolvedLang)) {
      html = hljs.highlight(code, { language: resolvedLang }).value;
    } else {
      html = hljs.highlightAuto(code).value;
    }
  } catch {
    html = code;
  }

  return (
    <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
  );
};

const Message = ({ msg, onEdit }: MessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);
  const [copied, setCopied] = useState(false);
  const [codeCopiedId, setCodeCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCodeCopy = useCallback(async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopiedId(id);
      setTimeout(() => setCodeCopiedId(prev => prev === id ? null : prev), 2000);
    } catch { /* fallback */ }
  }, []);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length,
      );
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditText(msg.content);
    }
  }, [msg.content, isEditing]);

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  };

  useEffect(() => {
    if (isEditing) adjustHeight();
  }, [isEditing, editText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSave = () => {
    if (editText.trim() && onEdit) {
      onEdit(msg.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(msg.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  const markdownComponents = useMemo(() => ({
    code({ className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const code = String(children).replace(/\n$/, '');

      if (!match) {
        return (
          <code className="bg-gray-200 dark:bg-[#3a3a3a] text-[#e8794e] dark:text-[#f59e6e] px-1.5 py-0.5 rounded-md text-sm font-mono before:content-none after:content-none" {...props}>
            {code}
          </code>
        );
      }

      const lang = match[1];
      const id = `${lang}-${code.slice(0, 20)}`;

      return (
        <div className="my-3 rounded-xl overflow-hidden border border-[#44475a]">
          <div className="flex items-center justify-between px-4 py-2 bg-[#21222c] border-b border-[#44475a]">
            <span className="text-xs text-gray-400 font-mono uppercase tracking-wide">{lang}</span>
            <button
              onClick={() => handleCodeCopy(code, id)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              {codeCopiedId === id ? <FiCheck size={13} /> : <FiCopy size={13} />}
              {codeCopiedId === id ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="!m-0 !rounded-none !border-0 bg-[#292C34] p-4 overflow-x-auto">
            <CodeBlock code={code} lang={lang} />
          </pre>
        </div>
      );
    },
    pre({ children }: any) {
      return <>{children}</>;
    },
    p({ children }: any) {
      return <p className="my-2 leading-7 text-gray-900 dark:text-gray-200">{children}</p>;
    },
    h1({ children }: any) {
      return <h1 className="text-2xl font-bold mt-6 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 className="text-xl font-semibold mt-5 mb-2 pb-1 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-white">{children}</h3>;
    },
    h4({ children }: any) {
      return <h4 className="text-base font-semibold mt-3 mb-1 text-gray-900 dark:text-white">{children}</h4>;
    },
    ul({ children }: any) {
      return <ul className="list-disc pl-6 my-2 space-y-1.5 text-gray-900 dark:text-gray-200 [&_ul]:list-circle [&_ul_ul]:list-square">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal pl-6 my-2 space-y-1.5 text-gray-900 dark:text-gray-200">{children}</ol>;
    },
    li({ children }: any) {
      return <li className="leading-7 [&>ul]:mt-1 [&>ol]:mt-1">{children}</li>;
    },
    blockquote({ children }: any) {
      return (
        <blockquote className="border-l-4 border-[#48A4FF] pl-4 my-3 py-1 bg-[#48A4FF]/5 dark:bg-[#48A4FF]/10 rounded-r-lg text-gray-700 dark:text-gray-300 italic">
          {children}
        </blockquote>
      );
    },
    table({ children }: any) {
      return (
        <div className="my-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">{children}</table>
        </div>
      );
    },
    thead({ children }: any) {
      return <thead className="bg-gray-100 dark:bg-[#2a2a2a]">{children}</thead>;
    },
    tbody({ children }: any) {
      return <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>;
    },
    tr({ children }: any) {
      return <tr className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50">{children}</tr>;
    },
    th({ children }: any) {
      return <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{children}</th>;
    },
    td({ children }: any) {
      return <td className="px-4 py-2.5 text-gray-900 dark:text-gray-200">{children}</td>;
    },
    a({ href, children }: any) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#48A4FF] hover:underline underline-offset-2">
          {children}
        </a>
      );
    },
    hr() {
      return <hr className="my-4 border-gray-300 dark:border-gray-600" />;
    },
  }), [codeCopiedId, handleCodeCopy]);

  if (msg.isTyping) {
    return (
      <div className="flex justify-start">
        <div className="lg:p-3 rounded-lg rounded-bl-none">
          <TypingIndicator />
        </div>
      </div>
    );
  }

  const showActions = msg.role === "user" && !isEditing && !msg.isStreaming;

  return (
    <div
      className={`flex flex-col ${
        msg.role === "user" ? "items-end" : "items-start"
      }`}
    >
      <div
        className={
          msg.role === "user"
            ? isEditing
              ? "bg-gray-200 dark:bg-[#3a3a3a] rounded-2xl w-full md:max-w-2xl"
              : "bg-gray-100 dark:bg-[#303030] rounded-2xl rounded-br-sm px-3 max-w-[85%]"
            : "w-full"
        }
      >
        {msg.isStreaming && !msg.content ? (
          <span className="flex space-x-1 px-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        ) : isEditing ? (
          <div className="flex flex-col rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500/50 transition-shadow">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => {
                setEditText(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              className="w-full resize-none overflow-hidden bg-transparent text-gray-900 dark:text-gray-100 p-3 text-base outline-none"
              rows={1}
            />
            <div className="flex items-center justify-end gap-1.5 px-3 pb-2">
              <button
                onClick={handleCancel}
                className="px-4 py-1.5 rounded-full text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-800 transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editText.trim()}
                className="px-4 py-1.5 rounded-full text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div>
            {msg.files && msg.files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {msg.files.map((file, i) =>
                  file.mimeType === "application/pdf" ? (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#3a3a3a] px-2 py-1.5 text-xs"
                    >
                      <svg
                        className="text-red-500 shrink-0"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <span className="max-w-24 truncate text-gray-600 dark:text-gray-400">
                        {file.name}
                      </span>
                    </div>
                  ) : (
                    <img
                      key={i}
                      src={`data:${file.mimeType};base64,${file.data}`}
                      alt={file.name}
                      className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                    />
                  ),
                )}
              </div>
            )}
            <div className="text-base text-gray-900 dark:text-gray-200 leading-relaxed">
              <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {msg.content}
              </Markdown>
            </div>
          </div>
        )}
      </div>
      {showActions && (
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-400/20 dark:hover:bg-gray-600/30 transition-all active:scale-95 cursor-pointer"
            title="Copy"
          >
            {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
          </button>

          <button
            onClick={() => {
              setEditText(msg.content);
              setIsEditing(true);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-400/20 dark:hover:bg-gray-600/30 transition-all active:scale-95 cursor-pointer"
            title="Edit"
          >
            <LuPencilLine size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Message;
