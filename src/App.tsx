import { useState, useEffect } from "react";
import Header from "./components/Header";
import AuditForm from "./components/AuditForm";
import AuditResults from "./components/AuditResults";
import { AuditReport, PrimaryUseCase, SelectedToolInput } from "./types";
import { ArrowRight, ShieldAlert, LineChart, Database } from "lucide-react";

export default function App() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [view, setView] = useState<"form" | "results">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [shareBaseUrl, setShareBaseUrl] = useState("");
  const [defaultFormMode, setDefaultFormMode] = useState<"full" | "lite">("full");

  // Check for shared links
  useEffect(() => {
    setShareBaseUrl(window.location.origin);

    const pathname = window.location.pathname;
    const shareMatch = pathname.match(/\/(share|report)\/([a-zA-Z0-9_\-]+)/);
    
    if (shareMatch) {
      const reportId = shareMatch[2];
      loadSharedReport(reportId);
    }
  }, []);

  const loadSharedReport = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/${id}?public=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.report) {
          setReport(data.report);
          setView("results");
        } else {
          console.warn("Could not retrieve shared report schema");
        }
      } else {
        console.warn("Report ID does not exist, forwarding to builder");
      }
    } catch (err) {
      console.error("Failed to load shared audit", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuditSubmit = async (formData: {
    companyName: string;
    teamSize: number;
    primaryUseCase: PrimaryUseCase;
    tools: SelectedToolInput[];
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Audit compilation network request failed.");
      }

      const data = await response.json();
      if (data.success && data.report) {
        setReport(data.report);
        setView("results");
        // Scroll smoothly to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert("We were unable to process your audit stack. Please try again.");
      }
    } catch (err) {
      console.error("Fail compiling audit on server side", err);
      alert("Trouble reaching the audit model service. Check your connection or retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadCaptureSubmit = async (leadData: {
    email: string;
    companyName: string;
    role: string;
    teamSize: number;
  }) => {
    if (!report) return;
    setLeadLoading(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          ...leadData
        })
      });

      if (!response.ok) {
        throw new Error("Failed to capture lead details in database");
      }

      const data = await response.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        alert("Unable to register lead details. Try again.");
      }
    } catch (err) {
      console.error("Failed backend lead storage write", err);
      alert("Network error trying to secure transaction limits.");
    } finally {
      setLeadLoading(false);
    }
  };

  const handleRefreshAudit = () => {
    setReport(null);
    setView("form");
    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-600 selection:text-white" id="main-app-container">
      <Header />

      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-start">
        <div className="space-y-6">
          
          {view === "form" && (
            <div className="space-y-4 text-center max-w-2xl mx-auto pb-4" id="home-intro-billboard">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 font-heading">
                <LineChart className="h-3.5 w-3.5" />
                THE MINT FOR STARTUP AI TOOL SPEND
              </span>
              <h1 className="font-heading font-black tracking-tight text-slate-950 text-3xl sm:text-4xl">
                Most startups are overspending on AI. <span className="text-indigo-600 block sm:inline">Audit your stack now.</span>
              </h1>
              <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                Enter your workspace seats, direct model API licenses, and tool plans inside the interactive benchmarks form below to reveal duplicate contracts, empty seats, and 25% Credex bulk-credit arbitrage savings in under 60 seconds.
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4" id="loading-spinner">
              <div className="relative h-12 w-12 flex items-center justify-center">
                <div className="absolute h-full w-full border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-semibold text-slate-800">Compiling Spend Models & Rules...</p>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed animate-pulse">Running finance-vetted rules and compiling executive procurement reports...</p>
              </div>
            </div>
          ) : (
            <>
              {view === "form" ? (
                <AuditForm
                  onSubmit={handleAuditSubmit}
                  isLoading={isLoading}
                  initialMode={defaultFormMode}
                  onModeChange={setDefaultFormMode}
                />
              ) : (
                report && (
                  <AuditResults
                    report={report}
                    onRefresh={handleRefreshAudit}
                    onUpgradeToFull={() => {
                      setDefaultFormMode("full");
                      setView("form");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onLeadSubmit={handleLeadCaptureSubmit}
                    leadLoading={leadLoading}
                    shareUrlBase={shareBaseUrl}
                  />
                )
              )}
            </>
          )}

        </div>
      </main>

      <footer className="border-t border-slate-100 bg-white py-6" id="app-footer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600 font-heading">AI Spend Auditor</span>
            <span>&copy; {new Date().getFullYear()} Credex AI Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://credex.ai" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Credex Credits Dashboard</a>
            <span className="text-slate-200">|</span>
            <a href="https://credex.ai/legal" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Privacy & Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
