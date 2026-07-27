import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center relative z-10">
          <div className="text-center">
            <div className="spinner mx-auto mb-4" style={{ width: 32, height: 32 }} />
            <p className="text-sm" style={{ color: "var(--muted)" }}>Loading dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
