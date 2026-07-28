"use client";

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
} from "lucide-react";
import UploadZone from "@/components/UploadZone";

const features = [
  {
    icon: Binary,
    title: "Binary Decompilation",
    description: "PyGhidra-powered headless analysis extracts pseudo-C code, function addresses, and symbols from any executable.",
  },
  {
    icon: Zap,
    title: "Paritok Compression",
    description: "Token reduction through Paritok's 4B compression model strips noise and reduces LLM costs by up to 74%.",
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "LLM agents reconstruct function intent, identify vulnerabilities, and propose meaningful variable renames.",
  },
  {
    icon: Shield,
    title: "Vulnerability Detection",
    description: "Automatically surfaces buffer overflows, format string bugs, hardcoded secrets, and injection vectors.",
  },
  {
    icon: Eye,
    title: "Visual Code Review",
    description: "Side-by-side code viewer with syntax highlighting shows original vs compressed decompilation.",
  },
  {
    icon: Code,
    title: "Ghidra Integration",
    description: "Export analysis as a Ghidra Python script to apply renames and annotations directly in the Ghidra GUI.",
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
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5" style={{ color: "var(--foreground)" }} />
          <span className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Ghidra-AI
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a 
            href="#features" 
            className="text-sm transition-colors hover:opacity-100" 
            style={{ color: "var(--muted-foreground)" }}
          >
            Features
          </a>
          <a 
            href="#upload" 
            className="text-sm font-medium px-3 py-1.5 rounded-md transition-all"
            style={{ 
              background: "var(--foreground)", 
              color: "var(--background)",
            }}
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md mb-8 fade-in"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}>
          <Cpu className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Powered by Paritok + Groq
          </span>
        </div>

        <h1
          className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-6 fade-in"
          style={{
            color: "var(--foreground)",
            animationDelay: "0.1s",
          }}
        >
          AI-Powered<br />Reverse Engineering
        </h1>

        <p
          className="text-lg max-w-2xl mx-auto mb-12 leading-relaxed fade-in"
          style={{ color: "var(--muted-foreground)", animationDelay: "0.2s" }}
        >
          Upload any binary. Ghidra decompiles it. Paritok compresses the noise.
          AI reconstructs the intent. All in one interface.
        </p>

        <div className="flex items-center justify-center gap-3 fade-in" style={{ animationDelay: "0.3s" }}>
          <a
            href="#upload"
            className="px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all hover:opacity-90"
            style={{
              background: "var(--foreground)",
              color: "var(--background)",
            }}
          >
            Start Analysis
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            className="px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all hover:opacity-100"
            style={{
              background: "transparent",
              color: "var(--muted-foreground)",
              border: "1px solid var(--border)",
            }}
          >
            <Code className="w-4 h-4" />
            View Source
          </a>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="max-w-4xl mx-auto px-6 mb-24">
        <div
          className="card p-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center"
        >
          {[
            { value: "74%", label: "Token Reduction" },
            { value: "<2s", label: "Analysis Time" },
            { value: "6+", label: "Vuln Categories" },
            { value: "$0", label: "Setup Cost" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold mb-1" style={{ color: "var(--foreground)" }}>{stat.value}</p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-5xl mx-auto px-6 mb-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
            Everything You Need
          </h2>
          <p className="text-base" style={{ color: "var(--muted-foreground)" }}>
            From binary to insights in minutes, not days.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="card p-6 fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="mb-4">
                <feature.icon className="w-5 h-5" style={{ color: "var(--foreground)" }} />
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Upload Section */}
      <section id="upload" className="max-w-3xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
            Ready to Analyze?
          </h2>
          <p className="text-base" style={{ color: "var(--muted-foreground)" }}>
            Drop your binary below to start the AI-powered reverse engineering pipeline.
          </p>
        </div>

        <UploadZone onUploadComplete={handleUploadComplete} />

        <p className="text-center text-xs mt-6" style={{ color: "var(--muted-foreground)" }}>
          Binaries are processed securely and never stored permanently. Supported formats: ELF, PE, raw binary.
        </p>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 mt-12 flex items-center justify-between border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
            Ghidra-AI
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Built with PyGhidra · Paritok · Groq · Next.js
        </p>
      </footer>
    </div>
  );
}
