import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { runAuditEngine, compileReport } from "./src/auditEngine";
import { getReport, saveReport, addLead, readDB } from "./server/db";
import { ToolID, PrimaryUseCase } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.post("/api/audit", async (req, res) => {
  const { companyName, teamSize, primaryUseCase, tools, isLite, estimatedTotalSpend } = req.body;
  if (!isLite && (!tools || !Array.isArray(tools))) {
    return res.status(400).json({ error: "Selected tools list is required for a full audit" });
  }

  try {
    const report = compileReport({
      companyName,
      teamSize: Number(teamSize) || 1,
      primaryUseCase: primaryUseCase as PrimaryUseCase,
      tools: tools || [],
      isLite: Boolean(isLite),
      estimatedTotalSpend: Number(estimatedTotalSpend) || 0
    });

    // Calculate benchmarks
    const db = await readDB();
    const reportsList = Object.values(db.reports || {});
    
    // Group similar reports
    const similarReports = reportsList.filter(r => {
      if (r.primaryUseCase !== primaryUseCase) return false;
      const bucketUser = teamSize <= 10 ? "small" : teamSize <= 50 ? "medium" : "large";
      const bucketOther = r.teamSize <= 10 ? "small" : r.teamSize <= 50 ? "medium" : "large";
      return bucketUser === bucketOther;
    });

    let averageFromDb: number | undefined;
    if (similarReports.length > 0) {
      const sumSpendsPerSeat = similarReports.reduce((sum, r) => {
        const seats = Math.max(1, r.teamSize);
        return sum + (r.totalCurrentSpend / seats);
      }, 0);
      averageFromDb = sumSpendsPerSeat / similarReports.length;
    }

    const { calculateBenchmark } = await import("./src/auditEngine");
    report.benchmark = calculateBenchmark(report.teamSize, report.primaryUseCase, report.totalCurrentSpend, averageFromDb);

    // Generate summary from Gemini
    const summary = await generateAiSummary(report);
    report.cfoSummary = summary;

    // Save report
    await saveReport(report);

    return res.json({ success: true, report });
  } catch (err) {
    console.error("Error creating audit report in backend", err);
    return res.status(500).json({ error: "Could not compile audit results" });
  }
});

app.get("/api/reports/:id", async (req, res) => {
  try {
    const report = await getReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Audit report not found" });
    }

    // Strip private info for shared link
    const isPublic = req.query.public === "true";
    if (isPublic) {
      const publicReport = { ...report };
      delete publicReport.leadInfo;
      delete publicReport.companyName;
      return res.json({ success: true, report: publicReport });
    }

    return res.json({ success: true, report });
  } catch (err) {
    console.error("Error searching audit report", err);
    return res.status(500).json({ error: "Internal server error fetching report" });
  }
});

app.post("/api/leads", async (req, res) => {
  const { reportId, email, companyName, role, teamSize } = req.body;
  if (!email || !reportId) {
    return res.status(400).json({ error: "Email and reportId are required" });
  }

  try {
    await addLead({
      reportId,
      email,
      companyName,
      role,
      teamSize: Number(teamSize) || undefined
    });

    const report = await getReport(reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Send simulated transactional confirmation email
    console.log(`\n==================================================`);
    console.log(`[TRANSACTIONAL EMAIL SIMULATION VIA RESEND/MOCK]`);
    console.log(`Sent to: ${email}`);
    console.log(`Subject: Action Saved $${report.totalSavingsMonthly}/mo — Your AI Spend Audit (Ref: ${reportId})`);
    console.log(`Body: Hello! Your AI Spend Audit Report is complete. Good news: we calculated immediate recurring optimizations of $${report.totalSavingsMonthly}/mo ($${report.totalSavingsAnnual}/year) across your AI software stack. You can view your dynamic audit anytime or book a detailed credit consultation with Credex here.`);
    console.log(`==================================================\n`);

    return res.json({ success: true, report });
  } catch (err) {
    console.error("Error creating lead submission", err);
    return res.status(500).json({ error: "Internal server error logging lead" });
  }
});

// Custom AI diagnostic helper
async function generateAiSummary(report: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is unset or default placeholder. Using client fallback summary algorithm.");
    return buildFallbackSummary(report);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const itemsSummary = report.results.map((r: any) =>
      `- ${r.toolName} (${r.currentPlanName}, ${r.currentSeats} seats). Monthly Outlay: $${r.currentSpend}. Recommended plan: ${r.recommendedPlanName}. Insight: ${r.reason}`
    ).join("\n");

    const prompt = `
You are a fractional CFO and AI SaaS cost analyst writing a brief, professional consulting diagnostic for a startup.
Our user submitted their current tool usage. Your company, Credex, sells heavily discounted AI credit agreements sourced from pre-funded entities.

Audit Overview:
- Company/Team: ${report.companyName}
- Use Case: ${report.primaryUseCase}
- Team Size: ${report.teamSize} users
- Monthly Cost Before Audit: $${report.totalCurrentSpend}/mo
- Monthly Cost After Audit: $${report.totalRecommendedSpend}/mo
- Total Recurring Savings: $${report.totalSavingsMonthly}/mo ($${report.totalSavingsAnnual}/year)

Detailed tool outline:
${itemsSummary}

Write an engaging, executive-level diagnostic summary paragraph of exactly ~100 words.
Pinpoint where their principal waste lies (duplicate developer IDE subscriptions, minimum seat triggers, or premium-priced API endpoints).
Explain that by standardizing layout seats and routing API payloads to Credex's flat 25% bulk credit arbitrage, they can easily secure these margins.
Use the precise dollar figures ($) provided. Keep the tone sharp, professional, with no general developer fluff or emojis. Focus purely on CFO-level impact.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.25,
        systemInstruction: "You are a professional CFO and senior AI software procurement auditor. You evaluate startup technology waste with extreme numerical precision."
      }
    });

    const text = response.text;
    if (text) {
      return text.trim();
    }
    return buildFallbackSummary(report);
  } catch (err) {
    console.error("Gemini compilation threw an error, falling back to static generator", err);
    return buildFallbackSummary(report);
  }
}

function buildFallbackSummary(report: any): string {
  const wasteTiers: string[] = [];
  let apiSpend = 0;

  report.results.forEach((r: any) => {
    if (r.toolId === ToolID.ANTHROPIC_API || r.toolId === ToolID.OPENAI_API || r.recommendedPlanId === "api") {
      apiSpend += r.currentSpend;
    }
    if (!r.isOptimal) {
      wasteTiers.push(r.toolName);
    }
  });

  const saves = report.totalSavingsMonthly;
  if (saves <= 0) {
    return `Based on a deep financial scan of your stack, your startup's AI tool spend is exceptionally optimized. You are utilizing appropriate seats and plans with no redundant licenses or unneeded seat minimum traps on platforms like Claude, ChatGPT, or Cursor. Keep monitoring optimization thresholds, and connect with Credex when scaling up API usage to unlock locked credit discounts.`;
  }

  const wasteSummary = wasteTiers.slice(0, 3).join(" and ");
  const arbitrageLine = apiSpend > 100
    ? ` Standardizing your models and migrating your raw monthly API spend of $${apiSpend}/mo into pre-purchased Credex bulk credit packages instantly shaves 25% off your usage bills with no code changes.`
    : ` Moving core workspace licenses into grouped structures and routing developer integrations through unified enterprise API lines lets you lock in these margins.`;

  return `Our financial diagnostic of ${report.companyName} reveals clear overspending of $${saves}/mo across your core stack, particularly within ${wasteSummary || "team licenses"}. By downsizing inactive seats, eliminating duplicate developer accounts, and addressing minimum-seat traps, you can scale back recurring software costs immediately.${arbitrageLine} This captures a total of $${report.totalSavingsAnnual}/year back into your operational margins.`;
}

// Open Graph intercept for report sharing
app.get(["/report/:id", "/share/:id"], async (req, res, next) => {
  const { id } = req.params;
  const report = await getReport(id);

  let templatePath = "";
  if (process.env.NODE_ENV !== "production") {
    templatePath = path.join(process.cwd(), "index.html");
  } else {
    templatePath = path.join(process.cwd(), "dist", "index.html");
  }

  try {
    let indexHtml = await fs.readFile(templatePath, "utf-8");

    let ogTitle = "AI Spend Auditor - Evaluate & Optimize Startup AI Costs";
    let ogDesc = "Calculate real savings on Cursor, Claude, ChatGPT, and API direct billing. Sourced with official 2026 pricing and discount recommendations.";

    if (report) {
      const company = report.companyName && report.companyName !== "Anonymous Startup" 
        ? report.companyName 
        : "A Startup";
      const savings = report.totalSavingsMonthly;
      if (savings > 0) {
        ogTitle = `${company} saved $${savings.toLocaleString()}/mo on AI tool spend!`;
        ogDesc = `Check out this instant AI spend audit: Saved $${(savings * 12).toLocaleString()}/year. Handled redundancy optimization and 25% direct API bulk credit discounts with Credex.`;
      } else {
        ogTitle = `Audit Complete: ${company} AI software stack is optimal!`;
        ogDesc = `Spend benchmark report showing 0% waste on Claude, Cursor, and OpenAI. Ready to scale and secure bulk credits via Credex.`;
      }
    }

    const ogTags = `
    <title>${ogTitle}</title>
    <meta name="description" content="${ogDesc}">
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${ogDesc}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop&auto=format&q=80">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${ogTitle}">
    <meta name="twitter:description" content="${ogDesc}">
    <meta name="twitter:image" content="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop&auto=format&q=80">
    `;

    // Inject ogTags into index.html
    indexHtml = indexHtml.replace("<head>", `<head>\n${ogTags}`);

    // Transform for development mode
    if (process.env.NODE_ENV !== "production" && (global as any).viteDevServer) {
      indexHtml = await (global as any).viteDevServer.transformIndexHtml(req.url, indexHtml);
    }

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(indexHtml);
  } catch (err) {
    console.error("Error matching Open Graph injection", err);
    next();
  }
});

// Start dev/production server
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    (global as any).viteDevServer = vite;
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Spend Auditor Backend Server] Running on http://localhost:${PORT}`);
  });
}

start();
