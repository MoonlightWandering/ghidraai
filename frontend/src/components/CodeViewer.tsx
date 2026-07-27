"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Code, Minimize2, Layers } from "lucide-react";

interface CodeViewerProps {
  originalCode: string;
  compressedCode?: string;
  functionName: string;
}

/** Basic C syntax highlighter — wraps tokens in <span> with class names */
function highlightC(code: string): string {
  const keywords = [
    "int", "void", "char", "unsigned", "long", "short", "float", "double",
    "if", "else", "while", "for", "do", "return", "switch", "case",
    "break", "continue", "default", "struct", "typedef", "enum", "union",
    "const", "static", "extern", "volatile", "sizeof", "goto", "NULL",
    "true", "false", "bool", "uint", "ulong", "byte", "undefined8",
    "undefined4", "undefined", "size_t", "FILE",
  ];

  let result = code
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Comments
  result = result.replace(/(\/\/[^\n]*)/g, '<span class="comment">$1</span>');
  result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');

  // Strings
  result = result.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="string">$1</span>');

  // Numbers (hex and decimal)
  result = result.replace(/\b(0x[0-9a-fA-F]+|[0-9]+)\b/g, '<span class="number">$1</span>');

  // Keywords
  const keywordPattern = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
  result = result.replace(keywordPattern, '<span class="keyword">$1</span>');

  // Function calls
  result = result.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="function-name">$1</span>(');

  return result;
}

function addLineNumbers(code: string): string {
  const lines = code.split("\n");
  return lines
    .map((line, i) => {
      const num = `<span class="line-number">${i + 1}</span>`;
      return `${num}${line}`;
    })
    .join("\n");
}

export default function CodeViewer({ originalCode, compressedCode, functionName }: CodeViewerProps) {
  const [view, setView] = useState<"original" | "compressed">("original");
  const [copied, setCopied] = useState(false);

  const activeCode = view === "compressed" && compressedCode ? compressedCode : originalCode;

  const highlighted = useMemo(() => {
    return addLineNumbers(highlightC(activeCode));
  }, [activeCode]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(34, 211, 238, 0.08)" }}>
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Decompiled Code
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ background: "rgba(34, 211, 238, 0.08)", color: "var(--accent)" }}>
            {functionName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg overflow-hidden"
            style={{ border: "1px solid rgba(34, 211, 238, 0.15)" }}>
            <button
              onClick={() => setView("original")}
              className="px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5"
              style={{
                background: view === "original" ? "rgba(34, 211, 238, 0.15)" : "transparent",
                color: view === "original" ? "var(--accent)" : "var(--muted)",
              }}
            >
              <Layers className="w-3 h-3" />
              Original
            </button>
            <button
              onClick={() => setView("compressed")}
              disabled={!compressedCode}
              className="px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-30"
              style={{
                background: view === "compressed" ? "rgba(34, 211, 238, 0.15)" : "transparent",
                color: view === "compressed" ? "var(--accent)" : "var(--muted)",
                borderLeft: "1px solid rgba(34, 211, 238, 0.15)",
              }}
            >
              <Minimize2 className="w-3 h-3" />
              Compressed
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg transition-colors"
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(34, 211, 238, 0.1)",
            }}
            title="Copy code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" style={{ color: "var(--success)" }} />
            ) : (
              <Copy className="w-3.5 h-3.5" style={{ color: "var(--muted)" }} />
            )}
          </button>
        </div>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto p-4">
        <pre
          className="code-block h-full"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  );
}
