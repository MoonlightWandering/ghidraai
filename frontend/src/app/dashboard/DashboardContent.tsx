"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Brain,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import TelemetryBar from "@/components/TelemetryBar";
import FunctionTree from "@/components/FunctionTree";
import CodeViewer from "@/components/CodeViewer";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import {
  getJobStatus,
  analyzeFunction,
  getTelemetry,
  exportGhidraScript,
  JobStatus,
  AnalysisResult,
  Telemetry,
} from "@/lib/api";

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id") || "";

  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    total_raw_tokens: 0,
    total_compressed_tokens: 0,
    compression_ratio_pct: 0,
    total_usd_saved: 0,
    total_functions_analyzed: 0,
    total_vulnerabilities_found: 0,
  });
  const [analysisCache, setAnalysisCache] = useState<Record<string, AnalysisResult>>({});
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedFunctionRef = useRef<string | null>(null);

  // Keep ref in sync
  useEffect(() => {
    selectedFunctionRef.current = selectedFunction;
  }, [selectedFunction]);

  // Poll job status
  const pollStatus = useCallback(async () => {
    if (!jobId) return;
    try {
      const status = await getJobStatus(jobId);
      setJobStatus(status);

      if (status.status === "completed" || status.status === "failed") {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        // Auto-select first function
        if (status.functions.length > 0 && !selectedFunctionRef.current) {
          setSelectedFunction(status.functions[0].name);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    pollStatus();
    pollingRef.current = setInterval(pollStatus, 1500);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobId, pollStatus]);

  // Refresh telemetry
  const refreshTelemetry = useCallback(async () => {
    try {
      const t = await getTelemetry();
      setTelemetry(t);
    } catch {
      // silently ignore telemetry errors
    }
  }, []);

  useEffect(() => {
    refreshTelemetry();
  }, [refreshTelemetry]);

  // Get the original code for selected function
  const getOriginalCode = (): string => {
    if (!selectedFunction || !jobStatus) return "// Select a function to view its code";
    const func = jobStatus.functions.find((f) => f.name === selectedFunction);
    if (!func) return "// Function not found";
    if (analysisCache[selectedFunction]) {
      return analysisCache[selectedFunction].original_code;
    }
    return `// Function: ${selectedFunction}\n// Address: ${func.address}\n// Size: ${func.size} bytes\n//\n// Click "Analyze Selected" to decompile and analyze this function`;
  };

  // Handle analysis
  const handleAnalyze = async (functionName: string) => {
    if (!jobId) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeFunction(jobId, functionName);
      setCurrentAnalysis(result);
      setAnalysisCache((prev) => ({ ...prev, [functionName]: result }));
      await refreshTelemetry();
      await pollStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle function selection
  const handleSelectFunction = (name: string) => {
    setSelectedFunction(name);
    if (analysisCache[name]) {
      setCurrentAnalysis(analysisCache[name]);
    } else {
      setCurrentAnalysis(null);
    }
  };

  // Handle export
  const handleExport = async () => {
    if (!jobId) return;
    try {
      const script = await exportGhidraScript(jobId);
      const blob = new Blob([script], { type: "text/x-python" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ghidra_ai_annotations_${jobId}.py`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  // Loading state
  if (!jobStatus || (jobStatus.status !== "completed" && jobStatus.status !== "failed")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 relative z-10">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center pulse-glow"
            style={{
              background: "rgba(34, 211, 238, 0.1)",
              border: "1px solid rgba(34, 211, 238, 0.2)",
            }}
          >
            <Brain className="w-10 h-10" style={{ color: "var(--accent)" }} />
          </div>
          <Loader2
            className="absolute -bottom-1 -right-1 w-6 h-6 animate-spin"
            style={{ color: "var(--accent)" }}
          />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            {jobStatus?.status === "extracting"
              ? "Decompiling Binary..."
              : "Initializing..."}
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {jobStatus?.progress || "Connecting to Ghidra..."}
          </p>
          {jobStatus?.filename && (
            <p className="text-xs mt-2 font-mono" style={{ color: "var(--accent)" }}>
              {jobStatus.filename}
            </p>
          )}
        </div>
        <div className="w-64 progress-bar mt-2">
          <div className="progress-bar-fill shimmer" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  if (jobStatus.status === "failed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 relative z-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.2)",
          }}
        >
          <Brain className="w-8 h-8" style={{ color: "var(--danger)" }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--danger)" }}>
          Extraction Failed
        </h2>
        <p className="text-sm max-w-md text-center" style={{ color: "var(--muted)" }}>
          {jobStatus.error || "Unknown error occurred"}
        </p>
        <a
          href="/"
          className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
          style={{
            background: "rgba(34, 211, 238, 0.1)",
            color: "var(--accent)",
            border: "1px solid rgba(34, 211, 238, 0.2)",
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Try Again
        </a>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative z-10">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3"
        style={{
          background: "rgba(6, 8, 13, 0.95)",
          borderBottom: "1px solid rgba(34, 211, 238, 0.1)",
        }}
      >
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent-dim), var(--accent))",
              }}
            >
              <Brain className="w-4 h-4" style={{ color: "#06080d" }} />
            </div>
            <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
              Ghidra-AI
            </span>
          </a>
          <div className="h-5 w-px" style={{ background: "rgba(34, 211, 238, 0.15)" }} />
          <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
            {jobStatus.filename}
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              color: "var(--success)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            {jobStatus.function_count} functions
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshTelemetry}
            className="p-2 rounded-lg transition-colors"
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(34, 211, 238, 0.1)",
            }}
          >
            <RefreshCw className="w-4 h-4" style={{ color: "var(--muted)" }} />
          </button>
        </div>
      </header>

      {/* Telemetry */}
      <TelemetryBar telemetry={telemetry} />

      {/* Error Banner */}
      {error && (
        <div
          className="px-6 py-2 flex items-center justify-between"
          style={{
            background: "rgba(244, 63, 94, 0.1)",
            borderBottom: "1px solid rgba(244, 63, 94, 0.2)",
          }}
        >
          <span className="text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </span>
          <button
            onClick={() => setError(null)}
            className="text-xs px-2 py-1 rounded"
            style={{ color: "var(--danger)" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Function Tree */}
        <div
          className="w-72 flex-shrink-0 overflow-hidden"
          style={{
            background: "rgba(6, 8, 13, 0.6)",
            borderRight: "1px solid rgba(34, 211, 238, 0.08)",
          }}
        >
          <FunctionTree
            functions={jobStatus.functions}
            selectedFunction={selectedFunction}
            onSelectFunction={handleSelectFunction}
            onAnalyzeFunction={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Center: Code Viewer */}
        <div className="flex-1 overflow-hidden" style={{ background: "rgba(6, 8, 13, 0.4)" }}>
          <CodeViewer
            originalCode={currentAnalysis?.original_code || getOriginalCode()}
            compressedCode={currentAnalysis?.compressed_code}
            functionName={selectedFunction || "none"}
          />
        </div>

        {/* Right: AI Insights */}
        <div
          className="w-80 flex-shrink-0 overflow-hidden"
          style={{
            background: "rgba(6, 8, 13, 0.6)",
            borderLeft: "1px solid rgba(34, 211, 238, 0.08)",
          }}
        >
          <AIInsightsPanel
            analysis={currentAnalysis}
            isAnalyzing={isAnalyzing}
            onExportScript={handleExport}
          />
        </div>
      </div>
    </div>
  );
}
