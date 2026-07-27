"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  Shield,
  Zap,
  Code,
  ArrowRight,
  Binary,
  Cpu,
  Eye,
  ExternalLink,
} from "lucide-react";
import UploadZone from "@/components/UploadZone";

const features = [
  {
    icon: Binary,
    title: "Binary Decompilation",
    description: "PyGhidra-powered headless analysis extracts pseudo-C code, function addresses, and symbols from any executable.",
    color: "#22d3ee",
  },
  {
    icon: Zap,
    title: "Paritok Compression",
    description: "Token reduction through Paritok's 4B compression model strips noise and reduces LLM costs by up to 74%.",
    color: "#a3e635",
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "LLM agents reconstruct function intent, identify vulnerabilities, and propose meaningful variable renames.",
    color: "#c084fc",
  },
  {
    icon: Shield,
    title: "Vulnerability Detection",
    description: "Automatically surfaces buffer overflows, format string bugs, hardcoded secrets, and injection vectors.",
    color: "#f43f5e",
  },
  {
    icon: Eye,
    title: "Visual Code Review",
    description: "Side-by-side code viewer with syntax highlighting shows original vs compressed decompilation.",
    color: "#60a5fa",
  },
  {
    icon: Code,
    title: "Ghidra Integration",
    description: "Export analysis as a Ghidra Python script to apply renames and annotations directly in the Ghidra GUI.",
    color: "#f59e0b",
  },
];

export default function LandingPage() {
  const router = useRouter();

  const handleUploadComplete = (jobId: string, filename: string) => {
    router.push(`/dashboard?job_id=${jobId}`);
  };

  return (
    <div className="min-h-screen relative z-10">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--accent-dim), var(--accent))",
              boxShadow: "0 0 20px rgba(34, 211, 238, 0.3)",
            }}
          >
            <Brain className="w-5 h-5" style={{ color: "#06080d" }} />
          </div>
          <span className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            Ghidra-AI
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm transition-colors" style={{ color: "var(--muted)" }}>
            Features
          </a>
          <a href="#upload" className="text-sm transition-colors" style={{ color: "var(--muted)" }}>
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 fade-in"
          style={{
            background: "rgba(34, 211, 238, 0.08)",
            border: "1px solid rgba(34, 211, 238, 0.2)",
          }}>
          <Cpu className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
            Powered by Paritok + Groq
          </span>
        </div>

        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 fade-in"
          style={{
            background: "linear-gradient(135deg, var(--foreground) 0%, var(--accent) 50%, var(--accent-bright) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animationDelay: "0.1s",
          }}
        >
          AI-Powered
          <br />
          Reverse Engineering
        </h1>

        <p
          className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed fade-in"
          style={{ color: "var(--muted)", animationDelay: "0.2s" }}
        >
          Upload any binary. Ghidra decompiles it. Paritok compresses the noise.
          AI reconstructs the intent. All in one sleek interface.
        </p>

        <div className="flex items-center justify-center gap-4 fade-in" style={{ animationDelay: "0.3s" }}>
          <a
            href="#upload"
            className="px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, var(--accent-dim), var(--accent))",
              color: "#06080d",
              boxShadow: "0 0 30px rgba(34, 211, 238, 0.2)",
            }}
          >
            Start Analysis
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            className="px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              color: "var(--foreground)",
              border: "1px solid rgba(34, 211, 238, 0.15)",
            }}
          >
            <ExternalLink className="w-4 h-4" />
            View Source
          </a>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="max-w-4xl mx-auto px-8 mb-20">
        <div
          className="glass-card p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center"
        >
          {[
            { value: "74%", label: "Token Reduction", color: "var(--success)" },
            { value: "<2s", label: "Analysis Time", color: "var(--accent)" },
            { value: "6+", label: "Vuln Categories", color: "var(--danger)" },
            { value: "$0.00", label: "Setup Cost", color: "#a3e635" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-5xl mx-auto px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
            Everything You Need
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            From binary to insights in minutes, not days.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="glass-card glow-border p-6 fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: `${feature.color}15`,
                  border: `1px solid ${feature.color}30`,
                }}
              >
                <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: "var(--foreground)" }}>
                {feature.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Upload Section */}
      <section id="upload" className="max-w-2xl mx-auto px-8 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
            Ready to Analyze?
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Drop your binary below to start the AI-powered reverse engineering pipeline.
          </p>
        </div>

        <div className="glass-card p-2">
          <UploadZone onUploadComplete={handleUploadComplete} />
        </div>

        <p className="text-center text-[10px] mt-4" style={{ color: "var(--muted)" }}>
          Binaries are processed locally and never stored permanently.
          Supported formats: ELF, PE, raw binary.
        </p>
      </section>

      {/* Footer */}
      <footer
        className="px-8 py-6 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(34, 211, 238, 0.08)" }}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            Ghidra-AI
          </span>
        </div>
        <p className="text-[10px]" style={{ color: "var(--muted)" }}>
          Built with PyGhidra · Paritok · Groq · Next.js
        </p>
      </footer>
    </div>
  );
}
