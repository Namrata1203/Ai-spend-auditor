import React, { useState } from "react";
import { Share2, Mail, ExternalLink, Calendar, CheckCircle, Copy, ShieldCheck, FileText, Building, ChevronRight, TrendingDown, RefreshCw, BarChart2 } from "lucide-react";
import { AuditReport, ToolID } from "../types";

interface AuditResultsProps {
  report: AuditReport;
  onRefresh: () => void;
  onUpgradeToFull?: () => void;
  onLeadSubmit: (leadData: {
    email: string;
    companyName: string;
    role: string;
    teamSize: number;
  }) => Promise<void>;
  leadLoading: boolean;
  shareUrlBase: string;
}

export default function AuditResults({ report, onRefresh, onUpgradeToFull, onLeadSubmit, leadLoading, shareUrlBase }: AuditResultsProps) {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState(report.companyName && report.companyName !== "Anonymous Startup" ? report.companyName : "");
  const [role, setRole] = useState("");
  const [copied, setCopied] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(false);

  const cleanShareUrl = `${shareUrlBase}/share/${report.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(cleanShareUrl);
      setCopied(true);
      setShowShareNotification(true);
      setTimeout(() => {
        setCopied(false);
        setShowShareNotification(false);
      }, 3000);
    } catch (e) {
      alert(`Copy link manually: ${cleanShareUrl}`);
    }
  };

  const handleLeadFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Email is required for transactional reports.");
      return;
    }
    onLeadSubmit({
      email: email.trim(),
      companyName: companyName.trim() || report.companyName || "Anonymous Startup",
      role: role.trim() || "Founder/Manager",
      teamSize: report.teamSize
    });
  };

  const isHighSavings = report.totalSavingsMonthly >= 500;
  const isOptimal = report.totalSavingsMonthly <= 50;

  // Spend percentage calculations
  const maxSpend = Math.max(report.totalCurrentSpend, 1);
  const currentPct = 100;
  const recommendedPct = (report.totalRecommendedSpend / maxSpend) * 100;

  // Score calculations
  const efficiencyScore = report.totalCurrentSpend > 0 
    ? Math.max(10, Math.min(100, Math.round((report.totalRecommendedSpend / report.totalCurrentSpend) * 100))) 
    : 100;

  const reductionPct = report.totalCurrentSpend > 0 
    ? Math.round((report.totalSavingsMonthly / report.totalCurrentSpend) * 100) 
    : 0;

  const overlapsCount = report.results.filter(item => item.savingsMonthly > 0).length;

  const redundancyLabel = report.totalSavingsMonthly > 400 
    ? "High" 
    : report.totalSavingsMonthly > 100 
      ? "Medium" 
      : "Low";

  return (
    <div className="space-y-6 animate-fadeIn" id="audit-results-panel">
      
      {/* HEADER BANNER CARD */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden border border-slate-850">
        <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
          <BarChart2 className="h-24 w-24" />
        </div>
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest border border-indigo-500/25">
            <ShieldCheck className="h-3 w-3 text-cyan-300 fill-cyan-300" />
            Audit Session Compiled
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight">
            {isOptimal 
              ? "Your startup's AI stack relies on streamlined structures!" 
              : `Duplicate software fees have leaked $${report.totalSavingsMonthly.toLocaleString()}/mo.`
            }
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            {isOptimal 
              ? "Outstanding. You have close to zero financial leakage. Review the benchmark guidelines below to keep limits and tiers safe as you scale up teams."
              : "By adjusting contract licenses, removing superfluous active builder seats, and transacting high-volume API tokens under Credex bulk lines, your savings materialize today."
            }
          </p>
        </div>
      </div>

      {/* DASHBOARD HERO METRIC BENTO CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="dashboard-bento-hero">
        {/* Card 1: Annual Savings */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Annual Savings</p>
            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight mt-1">
              ${report.totalSavingsAnnual.toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            Est. ROI: <span className="font-bold text-slate-700">{reductionPct}% reduction</span>
          </p>
        </div>

        {/* Card 2: Efficiency Score */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Efficiency Score</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {efficiencyScore}<span className="text-slate-300 font-light text-xl">/100</span>
            </p>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full ${efficiencyScore > 80 ? "bg-emerald-500" : efficiencyScore > 50 ? "bg-amber-400" : "bg-indigo-600"}`} 
                style={{ width: `${efficiencyScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Tool Redundancy */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tool Redundancy</p>
            <p className={`text-3xl font-extrabold tracking-tight mt-1 ${
              redundancyLabel === "High" ? "text-amber-600" : redundancyLabel === "Medium" ? "text-indigo-600" : "text-emerald-600"
            }`}>
              {redundancyLabel}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            {overlapsCount > 0 
              ? `${overlapsCount} overlapping subscription model${overlapsCount > 1 ? "s" : ""}` 
              : "Highly streamlined"
            }
          </p>
        </div>
      </div>

      {/* BEFORE VS AFTER COST COMPARISON BAR */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggregate Cost Comparison</h3>
        <div className="space-y-4">
          {/* Current spend bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Current Monthly Outlay
              </span>
              <span className="font-mono font-bold">${report.totalCurrentSpend}/mo</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-400 transition-all duration-1000"
                style={{ width: `${currentPct}%` }}
              />
            </div>
          </div>

          {/* Optimized spend bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-indigo-900">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                Optimized Monthly Cost
              </span>
              <span className="font-mono font-extrabold text-indigo-600">${report.totalRecommendedSpend}/mo</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000"
                style={{ width: `${recommendedPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CFO Diagnostic */}
      {report.cfoSummary && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-xl space-y-3 border-l-4 border-indigo-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 opacity-[0.03] flex items-center justify-center transform rotate-12">
            <FileText className="h-12 w-12" />
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400 fill-indigo-400/20" />
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">CFO Procurement Diagnostic Summary</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed font-sans border-t border-slate-800/80 pt-2.5">
            {report.cfoSummary}
          </p>
        </div>
      )}

      {/* Benchmarks */}
      {report.benchmark && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4" id="industry-benchmark-panel">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-5 h-5 bg-indigo-50 border border-indigo-100 rounded flex items-center justify-center text-indigo-600">
              <BarChart2 className="h-3 w-3" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-heading">AI Spend Benchmarking vs. Peers</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Your Monthly Spend Per Developer</span>
              <p className="text-xl font-extrabold text-slate-900 font-mono">
                ${report.benchmark.userSpendPerSeat} <span className="text-xs text-slate-400 font-medium font-sans">/ seat</span>
              </p>
              <p className="text-[11px] text-slate-500 font-medium">calculated based on {report.teamSize} active seats</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Industry Average (peers)</span>
              <p className="text-xl font-extrabold text-slate-700 font-mono">
                ${report.benchmark.industryAveragePerSeat} <span className="text-xs text-slate-400 font-medium font-sans">/ seat</span>
              </p>
              <p className="text-[11px] text-slate-500 font-medium">aggregated for same team bracket ({report.teamSize <= 10 ? "1-10 seats" : report.teamSize <= 50 ? "11-50 seats" : "50+ seats"}) & use case</p>
            </div>

            <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-150 flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">State vs. Average</span>
              {report.benchmark.comparisonStatus === "above" ? (
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-750 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase">
                    ▲ {report.benchmark.percentComparison}% Above Average
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">You are overspending compared to peer groups on AI subscriptions.</p>
                </div>
              ) : report.benchmark.comparisonStatus === "below" ? (
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                    ▼ {report.benchmark.percentComparison}% Below Average
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Superb! Your active layout spend is leaner than average industry outlays.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full uppercase">
                    ● About Average
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Your monthly subscription density aligns exactly with common peer metrics.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lite warning */}
      {report.isLite && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm" id="lite-audit-upgrade-banner">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5">
              ⚠️ Projected savings only
            </span>
            <h3 className="font-heading font-extrabold text-amber-900 text-sm">This is a high-level Lite estimate.</h3>
            <p className="text-xs text-amber-700/90 max-w-xl leading-relaxed">
              We calculated this output based on heuristic overspend algorithms in software configurations. For a certified, precise tool-by-tool breakdown with tailored plan choices, specify your active toolkit.
            </p>
          </div>
          <button
            type="button"
            onClick={onUpgradeToFull}
            id="upgrade-to-precise-btn"
            className="w-full md:w-auto text-center shrink-0 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-5 rounded-xl text-xs tracking-wider transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-98"
          >
            <ChevronRight className="h-3.5 w-3.5 text-cyan-300 pointer-events-none" />
            Enter Full Details for Precise Audit
          </button>
        </div>
      )}

      {/* Per-tool breakdowns */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Per-Tool Breakdown & Audits</h3>
        
        {report.results.map((item) => {
          const showWasteIcon = item.savingsMonthly > 0;

          return (
            <div 
              key={item.toolId}
              className={`bg-white p-5 rounded-2xl border transition-all ${
                showWasteIcon 
                  ? "border-amber-200/80 hover:border-amber-300 bg-gradient-to-r from-white to-amber-50/5 shadow-sm"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              id={`result-card-${item.toolId}`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${showWasteIcon ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                  <div>
                    <h4 className="font-heading font-bold text-slate-800 text-sm">{item.toolName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono font-medium">Entered Plan: {item.currentPlanName} ({item.currentSeats} seats)</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Before Dial</span>
                    <span className="font-mono text-xs font-bold text-slate-500">${item.currentSpend}/mo</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 hidden sm:block" />
                  <div className="text-right">
                    <span className="block text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Recommended Dial</span>
                    <span className="font-mono text-xs font-extrabold text-indigo-600">${item.recommendedSpend}/mo</span>
                  </div>
                </div>
              </div>


              <div className="pt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                <div className="md:max-w-2xl text-slate-650 leading-relaxed font-sans">
                  <span className="font-bold text-slate-800 block sm:inline mr-1">Recommended Action:</span>
                  {showWasteIcon ? (
                    <span className="text-amber-700 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-[11px] uppercase mr-1.5 inline-block">
                      Downgrade to {item.recommendedPlanName}
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[11px] uppercase mr-1.5 inline-block">
                      Keep Action Set
                    </span>
                  )}
                  <span className="text-slate-500 text-[11px] block sm:inline mt-1 sm:mt-0 font-medium">{item.reason}</span>
                </div>

                {showWasteIcon && (
                  <span className="shrink-0 font-mono font-extrabold text-amber-600 text-xs bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                    <TrendingDown className="h-3.5 w-3.5 stroke-[2.5]" />
                    -${item.savingsMonthly}/mo
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Consult CTA */}
      {isHighSavings && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm" id="credex-heavy-promo">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 rounded bg-indigo-600 text-white text-[9px] uppercase font-bold tracking-widest px-2 py-0.5">
              Credex Arbitrage Target
            </div>
            <h3 className="font-heading font-extrabold text-slate-900 text-base">You qualify for direct Credex corporate credits.</h3>
            <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
              With over $500/mo in potential savings, your organization qualifies for pre-purchased bulk server lines. We source excess allocations from tier-1 funded groups at 25% flat retail discounts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.open("https://calendly.com", "_blank");
            }}
            className="w-full md:w-auto text-center shrink-0 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs tracking-wider transition-all shadow-md cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-indigo-200" />
            Book Credits Consult
          </button>
        </div>
      )}

      {/* Lead capture */}
      <div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl shadow-sm flex flex-col space-y-4" id="lead-capture-card">
        <div className="flex items-center gap-2 pb-2.5 border-b border-indigo-50">
          <div className="w-6 h-6 bg-indigo-50 border border-indigo-100 rounded flex items-center justify-center text-indigo-600">
            <Mail className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-heading font-extrabold text-slate-800 text-sm">
            {report.leadCaptured ? "Your Audit Report is Locked In!" : "Email Transactional Delivery & Audit Storage"}
          </h3>
        </div>

        {report.leadCaptured ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 space-y-2 text-xs font-sans">
            <div className="flex items-center gap-1.5 font-bold font-heading">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Report Saved As Deployed State
            </div>
            <p className="font-medium text-[11px] text-emerald-700 leading-normal">
              We have compiled your audit. A confirmation transcript has been generated for you and sent to <strong className="text-slate-950 font-bold">{report.leadInfo?.email}</strong>. Our custom ledger specialist from Credex will reach out soon regarding credit arbitrage integrations.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLeadFormSubmit} className="space-y-4 text-xs font-sans">
            <p className="text-slate-500 font-medium leading-relaxed">
              Log your email to capture this layout report securely, download a detailed summary transcript, and get future notification updates if and when newer cost-reduction metrics trigger.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Your Work Email address</label>
                <input
                  type="email"
                  required
                  id="lead-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm hover:border-slate-350 focus:bg-white focus:border-indigo-500 outline-none transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Business Role/Title</label>
                <input
                  type="text"
                  id="lead-role-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Engineering Manager, CFO"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm hover:border-slate-350 focus:bg-white focus:border-indigo-500 outline-none transition-all text-slate-800"
                />
              </div>
            </div>


            <input type="text" className="hidden" tabIndex={-1} autoComplete="off" />

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={leadLoading}
                id="lead-submit-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all select-none cursor-pointer"
              >
                {leadLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Capture My Report</span>
                    <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Share controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
        <div className="space-y-1 text-center sm:text-left">
          <span className="font-heading font-bold text-slate-800 block">Audit Sharing URL Loop</span>
          <p className="text-[11px] text-slate-400 font-medium">Confidential business details are fully stripped from public links.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            readOnly
            value={cleanShareUrl}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-500 font-mono text-[10px] max-w-[240px] truncate"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            id="copy-share-btn"
            className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors shrink-0 focus:outline-none cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>


      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-600 font-semibold transition-colors focus:underline"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Audit New Workspace Configurations
        </button>
      </div>


      {showShareNotification && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-950 text-white rounded-xl py-3 px-4 shadow-lg flex items-center gap-2 border border-slate-800 text-xs font-medium animate-bounce">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>Shareable audit link successfully copied to your clipboard!</span>
        </div>
      )}
    </div>
  );
}
