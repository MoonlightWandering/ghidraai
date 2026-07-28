"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileCode, AlertCircle, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onUploadComplete: (jobId: string, filename: string) => void;
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_EXTENSIONS = [".elf", ".exe", ".bin", ".so", ".dll", ".o", ".out"];

  const validateFile = (file: File): boolean => {
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (!ALLOWED_EXTENSIONS.includes(ext) && file.name.includes(".")) {
      setError(`Unsupported file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleUpload = useCallback(
    async (file: File) => {
      if (!validateFile(file)) return;

      setSelectedFile(file);
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      // Simulate progress since fetch doesn't support progress natively
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Upload failed" }));
          throw new Error(err.detail || "Upload failed");
        }

        setUploadProgress(100);
        const data = await res.json();

        setTimeout(() => {
          onUploadComplete(data.job_id, data.filename);
        }, 500);
      } catch (err) {
        clearInterval(progressInterval);
        setError(err instanceof Error ? err.message : "Upload failed");
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [onUploadComplete]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div
      className={`upload-zone p-16 text-center transition-all ${
        isDragOver ? "drag-over" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".elf,.exe,.bin,.so,.dll,.o,.out"
        onChange={handleFileSelect}
      />

      {isUploading ? (
        <div className="fade-in">
          <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" style={{ color: "var(--foreground)" }} />
          <p className="text-base font-medium mb-1" style={{ color: "var(--foreground)" }}>
            Uploading {selectedFile?.name}
          </p>
          <div className="progress-bar max-w-xs mx-auto mt-4">
            <div
              className="progress-bar-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm mt-3" style={{ color: "var(--muted-foreground)" }}>
            {uploadProgress < 100 ? "Uploading binary..." : "Starting decompilation..."}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto transition-all"
              style={{ 
                background: "var(--surface)", 
                border: "1px solid var(--border)" 
              }}>
              <Upload className="w-7 h-7" style={{ color: "var(--muted-foreground)" }} />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            Drop your binary here
          </h3>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
            or click to browse for executable files
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {ALLOWED_EXTENSIONS.map((ext) => (
              <span
                key={ext}
                className="px-2.5 py-1 rounded text-xs font-mono"
                style={{
                  background: "var(--surface)",
                  color: "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                {ext}
              </span>
            ))}
          </div>
        </>
      )}

      {error && (
        <div className="mt-6 p-3 rounded-lg flex items-center gap-2 fade-in"
          style={{ 
            background: "rgba(255, 68, 68, 0.1)", 
            border: "1px solid rgba(255, 68, 68, 0.2)" 
          }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--danger)" }} />
          <span className="text-sm" style={{ color: "var(--danger)" }}>{error}</span>
        </div>
      )}
    </div>
  );
}
