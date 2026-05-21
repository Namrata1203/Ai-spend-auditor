import { ToolID, PrimaryUseCase, SelectedToolInput, ToolAuditResult, AuditReport, ToolConfig, AuditInput, BenchmarkData } from "./types";

// Verified pricing data as of May 2026

export const TOOL_CONFIGS: Record<ToolID, ToolConfig> = {
  [ToolID.CURSOR]: {
    id: ToolID.CURSOR,
    name: "Cursor",
    plans: [
      { id: "hobby", name: "Hobby", costPerSeat: 0 },
      { id: "pro", name: "Pro", costPerSeat: 20 },
      { id: "business", name: "Business", costPerSeat: 40 },
      { id: "enterprise", name: "Enterprise", costPerSeat: 100 }
    ],
    logoUrl: "Cursor"
  },
  [ToolID.GITHUB_COPILOT]: {
    id: ToolID.GITHUB_COPILOT,
    name: "GitHub Copilot",
    plans: [
      { id: "individual", name: "Individual", costPerSeat: 10 },
      { id: "business", name: "Business", costPerSeat: 19 },
      { id: "enterprise", name: "Enterprise", costPerSeat: 39 }
    ],
    logoUrl: "GitHubCopilot"
  },
  [ToolID.CLAUDE]: {
    id: ToolID.CLAUDE,
    name: "Claude",
    plans: [
      { id: "free", name: "Free", costPerSeat: 0 },
      { id: "pro", name: "Pro", costPerSeat: 20 },
      { id: "team", name: "Team", costPerSeat: 25, minSeats: 5 },
      { id: "enterprise", name: "Enterprise", costPerSeat: 75 },
      { id: "api", name: "API Direct (Usage)", costPerSeat: 0, isApiDirect: true }
    ],
    logoUrl: "Claude"
  },
  [ToolID.CHATGPT]: {
    id: ToolID.CHATGPT,
    name: "ChatGPT",
    plans: [
      { id: "free", name: "Free", costPerSeat: 0 },
      { id: "plus", name: "Plus", costPerSeat: 20 },
      { id: "team", name: "Team", costPerSeat: 30, minSeats: 2 },
      { id: "enterprise", name: "Enterprise", costPerSeat: 60 },
      { id: "api", name: "API Direct (Usage)", costPerSeat: 0, isApiDirect: true }
    ],
    logoUrl: "ChatGPT"
  },
  [ToolID.ANTHROPIC_API]: {
    id: ToolID.ANTHROPIC_API,
    name: "Anthropic API",
    plans: [
      { id: "payg", name: "Pay-as-you-go", costPerSeat: 0, isApiDirect: true }
    ],
    logoUrl: "Anthropic"
  },
  [ToolID.OPENAI_API]: {
    id: ToolID.OPENAI_API,
    name: "OpenAI API",
    plans: [
      { id: "payg", name: "Pay-as-you-go", costPerSeat: 0, isApiDirect: true }
    ],
    logoUrl: "OpenAI"
  },
  [ToolID.GEMINI]: {
    id: ToolID.GEMINI,
    name: "Gemini",
    plans: [
      { id: "advanced", name: "Advanced", costPerSeat: 20 },
      { id: "business", name: "Business", costPerSeat: 30 },
      { id: "api", name: "Vertex/Studio API", costPerSeat: 0, isApiDirect: true }
    ],
    logoUrl: "Gemini"
  },
  [ToolID.WINDSURF]: {
    id: ToolID.WINDSURF,
    name: "Windsurf",
    plans: [
      { id: "free", name: "Free", costPerSeat: 0 },
      { id: "pro", name: "Pro", costPerSeat: 20 },
      { id: "team", name: "Team", costPerSeat: 40 }
    ],
    logoUrl: "Windsurf"
  },
  [ToolID.V0]: {
    id: ToolID.V0,
    name: "v0 (by Vercel)",
    plans: [
      { id: "free", name: "Free", costPerSeat: 0 },
      { id: "premium", name: "Premium", costPerSeat: 20 },
      { id: "team", name: "Team", costPerSeat: 30, minSeats: 2 }
    ],
    logoUrl: "v0"
  }
};

export function calculateCurrentSpend(toolId: ToolID, planId: string, seats: number, customSpend?: number): number {
  const config = TOOL_CONFIGS[toolId];
  if (!config) return 0;
  
  const plan = config.plans.find(p => p.id === planId);
  if (!plan) return 0;

  if (plan.isApiDirect) {
    return customSpend || 0;
  }

  // Handle minimum seat requirements for billing
  const minSeats = plan.minSeats || 1;
  const billingSeats = Math.max(seats, minSeats);
  return billingSeats * plan.costPerSeat;
}

export function runAuditEngine(tools: SelectedToolInput[], teamSize: number, useCase: PrimaryUseCase): ToolAuditResult[] {
  const results: ToolAuditResult[] = [];
  const activeIds = new Set(tools.map(t => t.toolId));

  // Build temporary map of input for fast check
  const inputMap = new Map<ToolID, SelectedToolInput>();
  tools.forEach(t => inputMap.set(t.toolId, t));

  for (const toolInput of tools) {
    const { toolId, planId, seats, customSpend } = toolInput;
    const config = TOOL_CONFIGS[toolId];
    if (!config) continue;

    const plan = config.plans.find(p => p.id === planId);
    if (!plan) continue;

    const currentSpend = calculateCurrentSpend(toolId, planId, seats, customSpend);
    
    // Default recommendations (assume optimal unless optimized below)
    let recommendedPlanId = planId;
    let recommendedPlanName = plan.name;
    let recommendedSeats = seats;
    let recommendedSpend = currentSpend;
    let reason = "You are on an optimal plan matching your current team requirements.";
    let alternativeToolId: ToolID | undefined;
    let alternativePlanName: string | undefined;
    let credexAction: string | undefined;
    let isOptimal = true;

    // Rule 1: API Direct Arbitrage
    if (plan.isApiDirect || toolId === ToolID.ANTHROPIC_API || toolId === ToolID.OPENAI_API) {
      if (currentSpend > 0) {
        recommendedSpend = Math.round(currentSpend * 0.75); // 25% discount
        reason = `Save 25% on raw token bills using Credex pre-purchased bulk credits instead of paying retail price directly.`;
        isOptimal = false;
        credexAction = "Purchase discounted bulk API credits via Credex and save 25% instantly.";
      }
    }

    // Rule 2: Claude Team Minimum
    else if (toolId === ToolID.CLAUDE && planId === "team") {
      const minClaudeSeats = 5;
      if (seats < minClaudeSeats) {
        recommendedPlanId = "pro";
        recommendedPlanName = "Pro";
        recommendedSeats = seats;
        recommendedSpend = seats * 20;
        reason = `Claude Team plan has a 5-seat minimum ($125/mo). Moving your ${seats} users to individual Claude Pro plans ($20/mo each) stops you from paying for ${minClaudeSeats - seats} ghost seats.`;
        isOptimal = false;
      }
    }

    // Rule 3: ChatGPT Team Minimum
    else if (toolId === ToolID.CHATGPT && planId === "team") {
      const minChatGPTSeats = 2;
      if (seats < minChatGPTSeats) {
        recommendedPlanId = "plus";
        recommendedPlanName = "Plus";
        recommendedSeats = seats;
        recommendedSpend = seats * 20;
        reason = `ChatGPT Team has a 2-seat minimum ($60/mo). Downgrading to ChatGPT Plus ($20/mo) for 1 seat matches your usage exactly.`;
        isOptimal = false;
      }
    }

    // Rule 4: v0 Team Minimum
    else if (toolId === ToolID.V0 && planId === "team") {
      const minV0Seats = 2;
      if (seats < minV0Seats) {
        recommendedPlanId = "premium";
        recommendedPlanName = "Premium";
        recommendedSeats = seats;
        recommendedSpend = seats * 20;
        reason = `v0 Team requires a 2-seat minimum ($60/mo). Downsize to individual Premium ($20/mo) to stop wasting money on empty seats.`;
        isOptimal = false;
      }
    }

    // Rule 5: Cursor & Copilot Redundancy
    else if (toolId === ToolID.GITHUB_COPILOT && activeIds.has(ToolID.CURSOR)) {
      recommendedPlanId = "individual";
      recommendedSeats = 0;
      recommendedSpend = 0;
      reason = `You are paying for Cursor AND GitHub Copilot. Cursor includes a native, high-performance completion engine. Standardize on Cursor and cancel Copilot to save 100% of these seats.`;
      isOptimal = false;
    }

    // Rule 6: Cursor Business Plan Check
    else if (toolId === ToolID.CURSOR && planId === "business" && seats <= 4) {
      recommendedPlanId = "pro";
      recommendedPlanName = "Pro";
      recommendedSeats = seats;
      recommendedSpend = seats * 20;
      reason = `Cursor Business is $40/user/mo. Teams under 5 employees rarely need centralized SSO and SAML enforcement. Downgrading your ${seats} seats to Cursor Pro ($20/user/mo) saves 50% without loss of core AI features.`;
      isOptimal = false;
    }

    // Rule 7: Chat Tools Overlap
    else if (toolId === ToolID.CHATGPT && planId === "plus" && activeIds.has(ToolID.CLAUDE)) {
      const claudeInput = inputMap.get(ToolID.CLAUDE);
      if (claudeInput && claudeInput.seats === seats) {
        recommendedSeats = 0;
        recommendedSpend = 0;
        reason = `You pay for Claude Pro AND ChatGPT Plus subscriptions for the same team size. Standardize on Claude Pro for product/technical teams to eliminate redundant subscriptions.`;
        isOptimal = false;
      }
    }

    // Savings Calculation
    const savingsMonthly = currentSpend - recommendedSpend;
    const savingsAnnual = savingsMonthly * 12;

    results.push({
      toolId,
      toolName: config.name,
      currentPlanName: plan.name,
      currentSeats: seats,
      currentSpend,
      recommendedPlanId,
      recommendedPlanName,
      recommendedSeats,
      recommendedSpend: Math.max(0, recommendedSpend),
      savingsMonthly: Math.max(0, savingsMonthly),
      savingsAnnual: Math.max(0, savingsAnnual),
      reason,
      alternativeToolId,
      alternativePlanName,
      credexAction,
      isOptimal: savingsMonthly <= 0 && isOptimal
    });
  }

  return results;
}

export function calculateBenchmark(
  teamSize: number,
  primaryUseCase: PrimaryUseCase,
  totalCurrentSpend: number,
  averageFromDb?: number
): BenchmarkData {
  const seats = Math.max(1, teamSize);
  const userSpendPerSeat = Math.round(totalCurrentSpend / seats);

  // Baseline standard monthly seat spend by use case
  let baselinePerSeat = 35; // Default fallback
  const sizeKey = seats <= 10 ? "small" : seats <= 50 ? "medium" : "large";

  if (primaryUseCase === PrimaryUseCase.CODING) {
    baselinePerSeat = sizeKey === "small" ? 55 : sizeKey === "medium" ? 50 : 45;
  } else if (primaryUseCase === PrimaryUseCase.WRITING) {
    baselinePerSeat = sizeKey === "small" ? 35 : sizeKey === "medium" ? 30 : 25;
  } else if (primaryUseCase === PrimaryUseCase.DATA) {
    baselinePerSeat = sizeKey === "small" ? 40 : sizeKey === "medium" ? 35 : 30;
  } else if (primaryUseCase === PrimaryUseCase.RESEARCH) {
    baselinePerSeat = sizeKey === "small" ? 30 : sizeKey === "medium" ? 25 : 22;
  } else if (primaryUseCase === PrimaryUseCase.MIXED) {
    baselinePerSeat = sizeKey === "small" ? 38 : sizeKey === "medium" ? 32 : 28;
  }

  // If there is a real-time average calculated from DB, blend it using a Bayesian prior (weight=5)
  // to ensure smooth and realistic numbers even with small sample sizes
  let industryAveragePerSeat = baselinePerSeat;
  if (averageFromDb !== undefined && !isNaN(averageFromDb) && averageFromDb > 0) {
    industryAveragePerSeat = Math.round((baselinePerSeat * 5 + averageFromDb) / 6);
  }

  // Ensure it's reasonable
  industryAveragePerSeat = Math.max(15, industryAveragePerSeat);

  // Compare user spend against industry average scale
  const diffPct = ((userSpendPerSeat - industryAveragePerSeat) / industryAveragePerSeat) * 100;
  const percentComparison = Math.round(Math.abs(diffPct));

  let comparisonStatus: "above" | "below" | "average";
  // Buffer of +/- 5% for at-average status
  if (diffPct > 5) {
    comparisonStatus = "above";
  } else if (diffPct < -5) {
    comparisonStatus = "below";
  } else {
    comparisonStatus = "average";
  }

  return {
    userSpendPerSeat,
    industryAveragePerSeat,
    percentComparison,
    comparisonStatus
  };
}

export function compileReport(input: AuditInput): AuditReport {
  let results: ToolAuditResult[] = [];
  let totalCurrentSpend = 0;
  let totalSavingsMonthly = 0;

  if (input.isLite) {
    totalCurrentSpend = Number(input.estimatedTotalSpend) || 0;
    if (totalCurrentSpend > 80) {
      totalSavingsMonthly = Math.round(totalCurrentSpend * 0.32);
    } else {
      totalSavingsMonthly = 0;
    }

    const item1Current = Math.round(totalCurrentSpend * 0.4);
    const item1Savings = Math.round(totalSavingsMonthly * 0.5);

    const item2Current = Math.round(totalCurrentSpend * 0.3);
    const item2Savings = Math.round(totalSavingsMonthly * 0.3);

    const item3Current = totalCurrentSpend - item1Current - item2Current;
    const item3Savings = totalSavingsMonthly - item1Savings - item2Savings;

    // Projected/Estimated high-level items matches results structure smoothly
    results = [
      {
        toolId: ToolID.GITHUB_COPILOT,
        toolName: "GitHub Copilot / Cursor Redundancies",
        currentPlanName: "Projected IDE Seats (Lite Estimate)",
        currentSeats: input.teamSize,
        currentSpend: item1Current,
        recommendedPlanId: "optimized",
        recommendedPlanName: "Consolidated Workspace",
        recommendedSeats: input.teamSize,
        recommendedSpend: item1Current - item1Savings,
        savingsMonthly: item1Savings,
        savingsAnnual: item1Savings * 12,
        reason: "Duplicate IDE completion engines frequently exist among developers. Consolidating all active seats onto standard Cursor Pro plans eliminates this redundant waste immediately.",
        isOptimal: item1Savings <= 0
      },
      {
        toolId: ToolID.CLAUDE,
        toolName: "Claude / ChatGPT Overlap & Seats Minimums",
        currentPlanName: "Projected SaaS Teams (Lite Estimate)",
        currentSeats: input.teamSize,
        currentSpend: item2Current,
        recommendedPlanId: "optimized",
        recommendedPlanName: "Streamlined Accounts",
        recommendedSeats: input.teamSize,
        recommendedSpend: item2Current - item2Savings,
        savingsMonthly: item2Savings,
        savingsAnnual: item2Savings * 12,
        reason: "Startup groups regularly fall into 5-seat minimum traps on Claude Team or 2-seat minimums on ChatGPT. Transitioning to individual licenses prevents you from paying for ghost seats.",
        isOptimal: item2Savings <= 0
      },
      {
        toolId: ToolID.OPENAI_API,
        toolName: "Direct Foundation Model APIs (Volume Arbitrage)",
        currentPlanName: "Projected Token Volumes (Lite Estimate)",
        currentSeats: input.teamSize,
        currentSpend: item3Current,
        recommendedPlanId: "optimized",
        recommendedPlanName: "Credex Bulk credits",
        recommendedSeats: input.teamSize,
        recommendedSpend: item3Current - item3Savings,
        savingsMonthly: item3Savings,
        savingsAnnual: item3Savings * 12,
        reason: "Direct token consumption at retail pricing lacks enterprise volume rates. Transacting tokens with secondary pre-funded credits via Credex reduces monthly API outlays by 25%.",
        isOptimal: item3Savings <= 0
      }
    ];

  } else {
    results = runAuditEngine(input.tools || [], input.teamSize, input.primaryUseCase);
    results.forEach(r => {
      totalCurrentSpend += r.currentSpend;
      totalSavingsMonthly += r.savingsMonthly;
    });
  }

  const totalRecommendedSpend = Math.max(0, totalCurrentSpend - totalSavingsMonthly);
  const totalSavingsAnnual = totalSavingsMonthly * 12;

  const report: AuditReport = {
    id: Math.random().toString(36).substring(2, 11),
    companyName: input.companyName || "Anonymous Startup",
    teamSize: input.teamSize,
    primaryUseCase: input.primaryUseCase,
    tools: input.tools || [],
    results,
    totalCurrentSpend,
    totalRecommendedSpend,
    totalSavingsMonthly,
    totalSavingsAnnual,
    createdAt: new Date().toISOString(),
    isShared: false,
    leadCaptured: false,
    isLite: input.isLite || false,
    estimatedTotalSpend: input.estimatedTotalSpend
  };

  // Add default benchmark
  report.benchmark = calculateBenchmark(input.teamSize, input.primaryUseCase, totalCurrentSpend);

  return report;
}
