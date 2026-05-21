export enum ToolID {
  CURSOR = "cursor",
  GITHUB_COPILOT = "copilot",
  CLAUDE = "claude",
  CHATGPT = "chatgpt",
  ANTHROPIC_API = "anthropic_api",
  OPENAI_API = "openai_api",
  GEMINI = "gemini",
  WINDSURF = "windsurf",
  V0 = "v0"
}

export enum PrimaryUseCase {
  CODING = "coding",
  WRITING = "writing",
  DATA = "data",
  RESEARCH = "research",
  MIXED = "mixed"
}

export interface ToolPlan {
  id: string;
  name: string;
  costPerSeat: number;
  minSeats?: number;
  isApiDirect?: boolean;
}

export interface ToolConfig {
  id: ToolID;
  name: string;
  plans: ToolPlan[];
  logoUrl?: string;
}

export interface SelectedToolInput {
  toolId: ToolID;
  planId: string;
  seats: number;
  customSpend?: number; // For API Direct or overridden spent
}

export interface AuditInput {
  companyName?: string;
  teamSize: number;
  primaryUseCase: PrimaryUseCase;
  tools: SelectedToolInput[];
  contactEmail?: string;
  contactRole?: string;
  isLite?: boolean;
  estimatedTotalSpend?: number;
}

export interface BenchmarkData {
  userSpendPerSeat: number;
  industryAveragePerSeat: number;
  percentComparison: number; // e.g. +25% or -10%
  comparisonStatus: "above" | "below" | "average";
}

export interface ToolAuditResult {
  toolId: ToolID;
  toolName: string;
  currentPlanName: string;
  currentSeats: number;
  currentSpend: number;
  recommendedPlanId: string;
  recommendedPlanName: string;
  recommendedSeats: number;
  recommendedSpend: number;
  savingsMonthly: number;
  savingsAnnual: number;
  reason: string;
  alternativeToolId?: ToolID;
  alternativePlanName?: string;
  credexAction?: string;
  isOptimal: boolean;
}

export interface AuditReport {
  id: string;
  companyName?: string;
  teamSize: number;
  primaryUseCase: PrimaryUseCase;
  tools: SelectedToolInput[];
  results: ToolAuditResult[];
  totalCurrentSpend: number;
  totalRecommendedSpend: number;
  totalSavingsMonthly: number;
  totalSavingsAnnual: number;
  cfoSummary?: string;
  createdAt: string;
  isShared: boolean;
  leadCaptured: boolean;
  leadInfo?: {
    email: string;
    companyName?: string;
    role?: string;
    teamSize?: number;
  };
  isLite?: boolean;
  estimatedTotalSpend?: number;
  benchmark?: BenchmarkData;
}
