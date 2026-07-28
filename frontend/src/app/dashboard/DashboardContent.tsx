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
            className="w-16 h-16 rounded-lg flex items-center justify-center"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <Brain className="w-8 h-8" style={{ color: "var(--foreground)" }} />
          </div>
          <Loader2
            className="absolute -bottom-1 -right-1 w-5 h-5 animate-spin"
            style={{ color: "var(--muted-foreground)" }}
          />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            {jobStatus?.status === "extracting"
              ? "Decompiling Binary..."
              : "Initializing..."}
          </h2>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {jobStatus?.progress || "Connecting to Ghidra..."}
          </p>
          {jobStatus?.filename && (
            <p className="text-xs mt-2 font-mono" style={{ color: "var(--muted-foreground)" }}>
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
          className="w-14 h-14 rounded-lg flex items-center justify-center"
          style={{
            background: "rgba(255, 68, 68, 0.1)",
            border: "1px solid rgba(255, 68, 68, 0.2)",
          }}
        >
          <Brain className="w-7 h-7" style={{ color: "var(--danger)" }} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--danger)" }}>
          Extraction Failed
        </h2>
        <p className="text-sm max-w-md text-center" style={{ color: "var(--muted-foreground)" }}>
          {jobStatus.error || "Unknown error occurred"}
        </p>
        <a
          href="/"
          className="mt-4 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all"
          style={{
            background: "var(--surface)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
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
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          background: "var(--background)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
            <Brain className="w-5 h-5" style={{ color: "var(--foreground)" }} />
            <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              Ghidra-AI
            </span>
          </a>
          <div className="h-4 w-px" style={{ background: "var(--border)" }} />
          <span className="text-sm font-mono" style={{ color: "var(--muted-foreground)" }}>
            {jobStatus.filename}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{
              background: "rgba(0, 204, 136, 0.1)",
              color: "var(--success)",
              border: "1px solid rgba(0, 204, 136, 0.2)",
            }}
          >
            {jobStatus.function_count} functions
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshTelemetry}
            className="p-2 rounded-md transition-colors hover:opacity-70"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <RefreshCw className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
      </header>

      {/* Telemetry */}
      <TelemetryBar telemetry={telemetry} />

      {/* Error Banner */}
      {error && (
        <div
          className="px-6 py-3 flex items-center justify-between border-b"
          style={{
            background: "rgba(255, 68, 68, 0.05)",
            borderColor: "rgba(255, 68, 68, 0.2)",
          }}
        >
          <span className="text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </span>
          <button
            onClick={() => setError(null)}
            className="text-xs px-2 py-1 rounded hover:opacity-70"
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
          className="w-80 flex-shrink-0 overflow-hidden border-r"
          style={{
            background: "var(--background)",
            borderColor: "var(--border)",
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
        <div className="flex-1 overflow-hidden" style={{ background: "var(--background)" }}>
          <CodeViewer
            originalCode={currentAnalysis?.original_code || getOriginalCode()}
            compressedCode={currentAnalysis?.compressed_code}
            functionName={selectedFunction || "none"}
          />
        </div>

        {/* Right: AI Insights */}
        <div
          className="w-96 flex-shrink-0 overflow-hidden border-l"
          style={{
            background: "var(--background)",
            borderColor: "var(--border)",
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
