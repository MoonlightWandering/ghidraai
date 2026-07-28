"use client";

import { useState } from "react";
import { Search, ChevronRight, Shield, ShieldAlert, ShieldCheck, ShieldX, FileCode } from "lucide-react";
import { FunctionInfo } from "@/lib/api";

interface FunctionTreeProps {
  functions: FunctionInfo[];
  selectedFunction: string | null;
  onSelectFunction: (name: string) => void;
  onAnalyzeFunction: (name: string) => void;
  isAnalyzing: boolean;
}

function getRiskIcon(risk: string) {
  switch (risk) {
    case "high":
      return <ShieldX className="w-3.5 h-3.5" style={{ color: "var(--danger)" }} />;
    case "medium":
      return <ShieldAlert className="w-3.5 h-3.5" style={{ color: "var(--warning)" }} />;
    case "low":
      return <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--success)" }} />;
    default:
      return <Shield className="w-3.5 h-3.5" style={{ color: "var(--muted)" }} />;
  }
}

function getRiskBadgeClass(risk: string) {
  switch (risk) {
    case "high": return "badge-high";
    case "medium": return "badge-medium";
    case "low": return "badge-low";
    default: return "badge-none";
  }
}

export default function FunctionTree({
  functions,
  selectedFunction,
  onSelectFunction,
  onAnalyzeFunction,
  isAnalyzing,
}: FunctionTreeProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = functions.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const analyzed = functions.filter((f) => f.analyzed).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(34, 211, 238, 0.08)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Functions
            </h3>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{
            background: "rgba(34, 211, 238, 0.1)",
            color: "var(--accent)",
          }}>
            {analyzed}/{functions.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--muted)" }} />
          <input
            type="text"
            placeholder="Search functions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-all"
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(34, 211, 238, 0.1)",
              color: "var(--foreground)",
            }}
          />
        </div>
      </div>

      {/* Function List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map((func, idx) => (
          <button
            key={func.name}
            onClick={() => onSelectFunction(func.name)}
            className="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group"
            style={{
              background:
                selectedFunction === func.name
                  ? "rgba(34, 211, 238, 0.1)"
                  : "transparent",
              border:
                selectedFunction === func.name
                  ? "1px solid rgba(34, 211, 238, 0.2)"
                  : "1px solid transparent",
              animationDelay: `${idx * 30}ms`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <ChevronRight
                  className="w-3 h-3 flex-shrink-0 transition-transform"
                  style={{
                    color: selectedFunction === func.name ? "var(--accent)" : "var(--muted)",
                    transform: selectedFunction === func.name ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                />
                <span
                  className="text-sm font-mono truncate"
                  style={{
                    color: selectedFunction === func.name ? "var(--accent)" : "var(--foreground)",
                  }}
                >
                  {func.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {func.analyzed && (
                  <span className={`badge ${getRiskBadgeClass(func.risk)}`}>
                    {getRiskIcon(func.risk)}
                    {func.risk !== "none" ? func.risk : "safe"}
                  </span>
                )}
                {!func.analyzed && (
                  <span className="badge badge-none">pending</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1 ml-5">
              <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>
                {func.address}
              </span>
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                {func.size}B
              </span>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "var(--muted)" }}>No functions found</p>
          </div>
        )}
      </div>

      {/* Analyze Button */}
      <div className="p-3" style={{ borderTop: "1px solid rgba(34, 211, 238, 0.08)" }}>
        <button
          onClick={() => selectedFunction && onAnalyzeFunction(selectedFunction)}
          disabled={!selectedFunction || isAnalyzing}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--foreground)",
            color: "var(--background)",
          }}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              Analyzing...
            </span>
          ) : (
            "Analyze Selected"
          )}
        </button>
      </div>
    </div>
  );
}
