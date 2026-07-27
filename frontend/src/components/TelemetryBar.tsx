"use client";

import { Activity, Zap, DollarSign, TrendingDown, Shield, Cpu } from "lucide-react";
import { Telemetry } from "@/lib/api";

interface TelemetryBarProps {
  telemetry: Telemetry;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl"
      style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(34, 211, 238, 0.08)" }}>
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
      <div>
        <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--muted)" }}>
          {label}
        </p>
        <p className="text-sm font-bold counter-value" style={{ color, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function TelemetryBar({ telemetry }: TelemetryBarProps) {
  const compressionPct = telemetry.compression_ratio_pct || 0;

  return (
    <div
      className="w-full px-6 py-3 flex items-center justify-between gap-4 flex-wrap"
      style={{
        background: "rgba(6, 8, 13, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(34, 211, 238, 0.1)",
      }}
    >
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Telemetry
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <MetricCard
          icon={Shield}
          label="Vulns Found"
          value={telemetry.total_vulnerabilities_found.toString()}
          color="var(--danger)"
        />
      </div>
    </div>
  );
}
