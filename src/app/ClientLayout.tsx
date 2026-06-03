"use client";

import dynamic from "next/dynamic";
import { useReportWebVitals } from "next/web-vitals";
import { ThemeProvider } from "@/lib/theme";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Sidebar from "@/components/widgets/Sidebar";
import BottomNav from "@/components/widgets/BottomNav";
import BackToTop from "@/components/widgets/BackToTop";

const LoginDialog = dynamic(() => import("@/components/widgets/LoginDialog"), { ssr: false });

function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Log to console in dev; in production you could send to analytics endpoint
    if (process.env.NODE_ENV === "development") {
      console.log(`[WebVitals] ${metric.name}: ${Math.round(metric.value)} ${metric.rating}`);
    }
    // Example: beacon to /api/v1/health or external analytics
    // const body = JSON.stringify(metric);
    // if (navigator.sendBeacon) navigator.sendBeacon('/api/v1/metrics', body);
  });
  return null;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WebVitalsReporter />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-16 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
      <BackToTop />
      <ThemeToggle />
      <LoginDialog />
    </ThemeProvider>
  );
}
