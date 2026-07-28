"use client";

import {
  Brain,
  ArrowRight,
  Download,
  ShieldAlert,
  Sparkles,
  BarChart3,
  Loader2,
} from "lucide-react";
import VulnerabilityBadge, { detectSeverity } from "./VulnerabilityBadge";
import { AnalysisResult } from "@/lib/api";

interface AIInsightsPanelProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  onExportScript: () => void;
}

export default function AIInsightsPanel({
  analysis,
  isAnalyzing,
  onExportScript,
}: AIInsightsPanelProps) {
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center pulse-glow"
            style={{ background: "rgba(34, 211, 238, 0.1)", border: "1px solid rgba(34, 211, 238, 0.2)" }}>
            <Brain className="w-8 h-8" style={{ color: "var(--accent)" }} />
          </div>
          <Loader2 className="absolute -top-1 -right-1 w-5 h-5 animate-spin" style={{ color: "var(--accent)" }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            AI Analysis in Progress
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Compressing → Analyzing → Extracting insights...
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(100, 116, 139, 0.1)", border: "1px solid rgba(100, 116, 139, 0.2)" }}>
          <Brain className="w-8 h-8" style={{ color: "var(--muted)" }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
            No Analysis Yet
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Select a function and click &quot;Analyze Selected&quot;
          </p>
        </div>
      </div>
    );
  }

  const { analysis: ai, telemetry } = analysis;
  const renames = Object.entries(ai.variable_renames || {});
  const vulns = ai.vulnerabilities || [];
  const confidence = (ai.confidence_score * 100).toFixed(0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(34, 211, 238, 0.08)" }}>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            AI Insights
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3" style={{ color: "var(--success)" }} />
          <span className="text-xs font-bold" style={{ color: "var(--success)" }}>
            {confidence}% confidence
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Suggested Name */}
        <div className="fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
            <h4 className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--muted)" }}>
              Suggested Name
            </h4>
          </div>
          <div className="px-3 py-2 rounded-lg font-mono text-sm"
            style={{ background: "rgba(34, 211, 238, 0.08)", color: "var(--accent)", border: "1px solid rgba(34, 211, 238, 0.15)" }}>
            {ai.suggested_function_name}
          </div>
        </div>

        {/* Purpose Summary */}
        <div className="fade-in" style={{ animationDelay: "0.1s" }}>
          <h4 className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--muted)" }}>
            Purpose
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            {ai.purpose_summary}
          </p>
        </div>

        {/* Variable Renames */}
        {renames.length > 0 && (
          <div className="fade-in" style={{ animationDelay: "0.2s" }}>
            <h4 className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--muted)" }}>
              Variable Renames
            </h4>
            <div className="rounded-lg overflow-hidden"
              style={{ border: "1px solid rgba(34, 211, 238, 0.1)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(15, 23, 42, 0.6)" }}>
                    <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "var(--muted)" }}>
                      Old Name
                    </th>
                    <th className="px-2 py-2 w-8"></th>
                    <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "var(--muted)" }}>
                      New Name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {renames.map(([oldName, newName], i) => (
                    <tr
                      key={oldName}
                      style={{
                        borderTop: i > 0 ? "1px solid rgba(34, 211, 238, 0.05)" : undefined,
                      }}
                    >
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: "var(--danger)" }}>
                        {oldName}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <ArrowRight className="w-3 h-3 mx-auto" style={{ color: "var(--muted)" }} />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: "var(--success)" }}>
                        {newName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vulnerabilities */}
        <div className="fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: vulns.length > 0 ? "var(--danger)" : "var(--success)" }} />
            <h4 className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--muted)" }}>
              Vulnerabilities ({vulns.length})
            </h4>
          </div>
          {vulns.length > 0 ? (
            <div className="space-y-2">
              {vulns.map((vuln, i) => (
                <VulnerabilityBadge
                  key={i}
                  severity={detectSeverity(vuln)}
                  text={vuln}
                />
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg" style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <p className="text-sm" style={{ color: "var(--success)" }}>
                No vulnerabilities detected
              </p>
            </div>
          )}
        </div>


      </div>

      {/* Export Button */}
      <div className="p-3" style={{ borderTop: "1px solid rgba(34, 211, 238, 0.08)" }}>
        <button
          onClick={onExportScript}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: "rgba(34, 211, 238, 0.1)",
            border: "1px solid rgba(34, 211, 238, 0.2)",
            color: "var(--accent)",
          }}
        >
          <Download className="w-4 h-4" />
          Export Ghidra Script (.py)
        </button>
      </div>
    </div>
  );
}
