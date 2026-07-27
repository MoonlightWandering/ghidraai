/**
 * Ghidra-AI — API Client
 * Handles all communication with the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface FunctionInfo {
  name: string;
  address: string;
  size: number;
  analyzed: boolean;
  risk: "none" | "low" | "medium" | "high";
  vulnerability_count: number;
}

export interface JobStatus {
  job_id: string;
  status: "pending" | "extracting" | "completed" | "failed";
  progress: string;
  function_count: number;
  functions: FunctionInfo[];
  filename: string;
  file_size: number;
  error?: string;
}

export interface AnalysisResult {
  function_name: string;
  original_code: string;
  cleaned_code: string;
  compressed_code: string;
  compression: {
    input_tokens: number;
    output_tokens: number;
    ratio: number;
    mode: string;
  };
  analysis: {
    suggested_function_name: string;
    purpose_summary: string;
    variable_renames: Record<string, string>;
    vulnerabilities: string[];
    confidence_score: number;
    _meta?: {
      model: string;
      provider: string;
    };
  };
  telemetry: {
    tokens_saved: number;
    compression_pct: number;
    usd_saved: number;
  };
}

export interface Telemetry {
  total_raw_tokens: number;
  total_compressed_tokens: number;
  compression_ratio_pct: number;
  total_usd_saved: number;
  total_functions_analyzed: number;
  total_vulnerabilities_found: number;
}

export async function uploadBinary(file: File): Promise<{ job_id: string; filename: string; file_size: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }

  return res.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${API_BASE}/api/status/${jobId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch job status");
  }
  return res.json();
}

export async function analyzeFunction(jobId: string, functionName: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, function_name: functionName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(err.detail || "Analysis failed");
  }

  return res.json();
}

export async function analyzeAllFunctions(jobId: string): Promise<Record<string, AnalysisResult>> {
  const res = await fetch(`${API_BASE}/api/analyze/all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId }),
  });

  if (!res.ok) {
    throw new Error("Batch analysis failed");
  }

  const data = await res.json();
  return data.results;
}

export async function getTelemetry(): Promise<Telemetry> {
  const res = await fetch(`${API_BASE}/api/telemetry`);
  if (!res.ok) {
    throw new Error("Failed to fetch telemetry");
  }
  return res.json();
}

export async function exportGhidraScript(jobId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/export/${jobId}`);
  if (!res.ok) {
    throw new Error("Failed to export script");
  }
  return res.text();
}
