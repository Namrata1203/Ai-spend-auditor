import React, { useState, useEffect } from "react";
import { Plus, Trash2, Info, Building, Users, Sliders, BarChart2, ShieldCheck } from "lucide-react";
import { ToolID, PrimaryUseCase, SelectedToolInput } from "../types";
import { TOOL_CONFIGS, calculateCurrentSpend } from "../auditEngine";

interface AuditFormProps {
  onSubmit: (formData: {
    companyName: string;
    teamSize: number;
    primaryUseCase: PrimaryUseCase;
    tools: SelectedToolInput[];
    isLite?: boolean;
    estimatedTotalSpend?: number;
  }) => void;
  isLoading: boolean;
  initialMode?: "full" | "lite";
  onModeChange?: (mode: "full" | "lite") => void;
}

const STORAGE_KEY = "credex_audit_form_state";

export default function AuditForm({ onSubmit, isLoading, initialMode = "full", onModeChange }: AuditFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [teamSize, setTeamSize] = useState(3);
  const [primaryUseCase, setPrimaryUseCase] = useState<PrimaryUseCase>(PrimaryUseCase.CODING);
  const [auditMode, setAuditMode] = useState<"full" | "lite">(initialMode);
  const [estimatedTotalSpend, setEstimatedTotalSpend] = useState<number>(350);
  
  // Initial tools state
  const [selectedTools, setSelectedTools] = useState<SelectedToolInput[]>([
    { toolId: ToolID.CURSOR, planId: "pro", seats: 3 },
    { toolId: ToolID.GITHUB_COPILOT, planId: "business", seats: 3 },
    { toolId: ToolID.CLAUDE, planId: "team", seats: 3 }
  ]);

  // Sync mode changes externally
  useEffect(() => {
    if (initialMode) {
      setAuditMode(initialMode);
    }
  }, [initialMode]);

  const handleModeChange = (mode: "full" | "lite") => {
    setAuditMode(mode);
    onModeChange?.(mode);
  };

  // Load state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.companyName !== undefined) setCompanyName(parsed.companyName);
        if (parsed.teamSize !== undefined) setTeamSize(parsed.teamSize);
        if (parsed.primaryUseCase !== undefined) setPrimaryUseCase(parsed.primaryUseCase);
        if (parsed.selectedTools !== undefined) setSelectedTools(parsed.selectedTools);
        if (parsed.estimatedTotalSpend !== undefined) setEstimatedTotalSpend(parsed.estimatedTotalSpend);
        if (parsed.auditMode !== undefined) setAuditMode(parsed.auditMode);
      }
    } catch (e) {
      console.warn("Could not reload saved cache state", e);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ companyName, teamSize, primaryUseCase, selectedTools, estimatedTotalSpend, auditMode })
      );
    } catch (e) {
      console.error("Storage save issue", e);
    }
  }, [companyName, teamSize, primaryUseCase, selectedTools, estimatedTotalSpend, auditMode]);

  const handleAddTool = (toolId: ToolID) => {
    // Avoid duplicate tools
    if (selectedTools.any && selectedTools.some(t => t.toolId === toolId)) return;
    
    const config = TOOL_CONFIGS[toolId];
    if (!config) return;

    // Use the first available plan (default represents first non-free plan or base plan)
    const defaultPlan = config.plans.find(p => p.id !== "free") || config.plans[0];
    
    setSelectedTools([
      ...selectedTools,
      {
        toolId,
        planId: defaultPlan.id,
        seats: teamSize || 1,
        customSpend: defaultPlan.isApiDirect ? 100 : undefined
      }
    ]);
  };

  const handleRemoveTool = (index: number) => {
    const updated = [...selectedTools];
    updated.splice(index, 1);
    setSelectedTools(updated);
  };

  const handleToolChange = (index: number, key: keyof SelectedToolInput, value: any) => {
    const updated = [...selectedTools];
    updated[index] = {
      ...updated[index],
      [key]: value
    };

    // Adjust default values on plan change
    if (key === "planId") {
      const toolId = updated[index].toolId;
      const plan = TOOL_CONFIGS[toolId]?.plans.find(p => p.id === value);
      if (plan) {
        if (plan.isApiDirect) {
          updated[index].customSpend = updated[index].customSpend || 100;
        } else {
          delete updated[index].customSpend;
        }
      }
    }

    setSelectedTools(updated);
  };

  const calculateQuickTotal = () => {
    return selectedTools.reduce((acc, t) => {
      return acc + calculateCurrentSpend(t.toolId, t.planId, t.seats, t.customSpend);
    }, 0);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (auditMode === "full" && selectedTools.length === 0) {
      alert("Please select at least one active AI tool to audit.");
      return;
    }
    if (auditMode === "lite" && (!estimatedTotalSpend || estimatedTotalSpend <= 0)) {
      alert("Please enter a valid estimated monthly AI spend (greater than 0).");
      return;
    }
    onSubmit({
      companyName: companyName.trim() || "",
      teamSize,
      primaryUseCase,
      tools: auditMode === "lite" ? [] : selectedTools,
      isLite: auditMode === "lite",
      estimatedTotalSpend: auditMode === "lite" ? Number(estimatedTotalSpend) : undefined
    });
  };

  // Unselected tools list
  const unselectedToolsList = Object.values(TOOL_CONFIGS).filter(
    config => !selectedTools.some(t => t.toolId === config.id)
  );

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" id="audit-input-form">
      {/* Dynamic Tab Selector */}
      <div className="flex p-1 bg-slate-100 rounded-xl max-w-md mx-auto" id="audit-mode-tabs">
        <button
          type="button"
          onClick={() => handleModeChange("full")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            auditMode === "full"
              ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
          id="tab-full-audit"
        >
          <Sliders className="h-3.5 w-3.5" />
          Full Tool Audit
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("lite")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            auditMode === "lite"
              ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
          id="tab-lite-audit"
        >
          <BarChart2 className="h-3.5 w-3.5" />
          Lite Quick estimate
        </button>
      </div>

      {/* Step 1: General Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
          <div className="w-6 h-6 bg-indigo-50 border border-indigo-100 rounded flex items-center justify-center text-indigo-600">
            <Building className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-slate-800 font-heading">1. General Setup & Benchmark</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Company Name (Optional)</label>
            <input
              type="text"
              id="company-name-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Inc"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 hover:border-slate-350 focus:bg-white focus:border-indigo-500 transition-all font-medium text-slate-800 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Team size (Seats)</label>
            <input
              type="number"
              id="team-size-input"
              min={1}
              max={500}
              value={teamSize}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                setTeamSize(val);
                // Sync seats to selected tools
                setSelectedTools(selectedTools.map(t => {
                  const plan = TOOL_CONFIGS[t.toolId]?.plans.find(p => p.id === t.planId);
                  if (plan?.isApiDirect) return t;
                  return { ...t, seats: val };
                }));
              }}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 hover:border-slate-350 focus:bg-white focus:border-indigo-500 transition-all font-medium font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Primary Use Case</label>
            <select
              id="use-case-select"
              value={primaryUseCase}
              onChange={(e) => setPrimaryUseCase(e.target.value as PrimaryUseCase)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 hover:border-slate-350 focus:bg-white focus:border-indigo-500 transition-all font-semibold text-slate-700"
            >
              <option value={PrimaryUseCase.CODING}>Coding & Software Eng</option>
              <option value={PrimaryUseCase.WRITING}>Writing & Marketing Copy</option>
              <option value={PrimaryUseCase.DATA}>Data Analysis & Analytics</option>
              <option value={PrimaryUseCase.RESEARCH}>Research & Product Discovery</option>
              <option value={PrimaryUseCase.MIXED}>Mixed/General Purpose</option>
            </select>
          </div>
        </div>
      </div>

      {/* Step 2: Tools selection */}
      {auditMode === "full" ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-50 border border-indigo-100 rounded flex items-center justify-center text-indigo-600">
                <Users className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold tracking-tight text-slate-800 font-heading">2. Current AI Active Spend Stack</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Quick Total: <span className="text-indigo-600">${calculateQuickTotal()}/mo</span>
            </span>
          </div>

          {selectedTools.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 bg-slate-50/30">
              <p className="text-sm text-slate-400 font-medium font-sans">No tools added yet. Use the selection list below to catalog your subscriptions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedTools.map((t, idx) => {
                const config = TOOL_CONFIGS[t.toolId];
                if (!config) return null;
                const plan = config.plans.find(p => p.id === t.planId);
                const supportsSeats = plan ? !plan.isApiDirect : true;

                return (
                  <div
                    key={t.toolId}
                    className="p-4.5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:shadow-subtlest transition-all flex flex-col md:flex-row items-start md:items-center gap-4 text-sm"
                    id={`tool-row-${t.toolId}`}
                  >
                    {/* Tool Identity Info */}
                    <div className="md:w-1/4">
                      <span className="font-heading font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-600 inline-block"></span>
                        {config.name}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-semibold font-mono tracking-tight block mt-0.5">
                        Plan Options: {config.plans.length} tiers
                      </span>
                    </div>

                    {/* Plan Picker */}
                    <div className="w-full md:w-1/4">
                      <select
                        id={`plan-select-${t.toolId}`}
                        value={t.planId}
                        onChange={(e) => handleToolChange(idx, "planId", e.target.value)}
                        className="w-full bg-white text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-2.5 py-2 hover:border-slate-330"
                      >
                        {config.plans.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Seat allocation or custom API spend */}
                    <div className="w-full md:w-1/3 flex items-center gap-2">
                      {supportsSeats ? (
                        <>
                          <div className="flex-1">
                            <input
                              type="number"
                              id={`seats-input-${t.toolId}`}
                              min={1}
                              max={500}
                              value={t.seats}
                              onChange={(e) => handleToolChange(idx, "seats", Math.max(1, parseInt(e.target.value) || 1))}
                              placeholder="Seats"
                              className="w-full bg-white text-xs font-mono font-semibold border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800"
                            />
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium font-mono whitespace-nowrap">
                            seats @ ${plan ? plan.costPerSeat : 0}/mo
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-semibold">$</span>
                              <input
                                type="number"
                                id={`spend-input-${t.toolId}`}
                                min={1}
                                value={t.customSpend || 100}
                                onChange={(e) => handleToolChange(idx, "customSpend", Math.max(0, parseInt(e.target.value) || 0))}
                                placeholder="Monthly Spend"
                                className="w-full bg-white text-xs font-mono font-semibold border border-slate-200 rounded-lg pl-6 pr-2 py-2 text-slate-800"
                              />
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium font-mono whitespace-nowrap">
                            gross tokens bill/mo
                          </span>
                        </>
                      )}
                    </div>

                    {/* Outlay computation & delete button */}
                    <div className="flex items-center justify-between w-full md:w-auto md:ml-auto gap-4">
                      <span className="font-mono text-sm font-bold text-slate-900 border-l border-slate-200 pl-4">
                        ${calculateCurrentSpend(t.toolId, t.planId, t.seats, t.customSpend)}/mo
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTool(idx)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg border border-slate-100 hover:border-rose-100 transition-colors"
                        title="Remove Tool"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add more tools list dropdown option bar */}
          {unselectedToolsList.length > 0 && (
            <div className="pt-4 border-t border-slate-100 flex items-center flex-wrap gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Track another tool:</span>
              {unselectedToolsList.map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleAddTool(item.id)}
                  className="inline-flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 transition-all font-semibold font-sans cursor-pointer hover:border-slate-350"
                >
                  <Plus className="h-3 w-3 text-indigo-600 stroke-[2.5]" />
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4" id="lite-spend-section">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <div className="w-6 h-6 bg-indigo-50 border border-indigo-100 rounded flex items-center justify-center text-indigo-600">
              <BarChart2 className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-slate-800 font-heading">2. Estimated Spend Profile</h2>
          </div>

          <div className="max-w-md mx-auto py-4 space-y-4 text-center">
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
              No account configurations are needed. Simply enter your total approximate monthly recurring spend on SaaS memberships & model APIs.
            </p>

            <div className="relative inline-block w-full max-w-xs">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 font-mono">$</span>
              <input
                type="number"
                id="lite-total-spend-input"
                min={1}
                max={1000000}
                value={estimatedTotalSpend || ""}
                onChange={(e) => setEstimatedTotalSpend(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="e.g. 1200"
                className="w-full text-center text-xl font-extrabold font-mono bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-16 py-3.5 text-indigo-700 hover:border-slate-350 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase font-mono text-slate-400 tracking-wider">/ mo</span>
            </div>
          </div>
        </div>
      )}

      {/* CFO CTA Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-6 rounded-2xl bg-slate-900 border border-slate-850 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-[0.02] transform translate-x-4 -translate-y-4">
          <BarChart2 className="h-32 w-32" />
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 shrink-0 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading tracking-tight">Benchmark AI Subscription Audit</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-normal">Computes instant optimization, assesses minimum-seat traps, detects tool overlaps, and executes our proprietary spend-modeling logic.</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          id="run-audit-btn"
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-indigo-950/20 select-none cursor-pointer hover:translate-y-[-1px] active:translate-y-[0px] active:scale-98 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Auditing...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 text-cyan-300 fill-cyan-300 animate-pulse" />
              <span>Generate Audit Report</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
