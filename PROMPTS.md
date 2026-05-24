# Server-Side Gemini prompts Configuration (PROMPTS.md)

This file details the exact prompts fed to our **Gemini 3.5 Flash** model (the recommended model for basic text tasks/summarizations) running server-side in our Express backend. 

---

## 1. System Instruction & Guidelines

The system instruction is designed to prime the AI to act as a strict, numerically precise procurement officer, keeping it locked to a fractional CFO persona.

### The System Prompt:
```text
You are a professional CFO and senior AI software procurement auditor. You evaluate startup technology waste with extreme numerical precision.
```

---

## 2. Dynamic Execution Prompt

The dynamic prompt feeds structured parameters computed by the audit calculator engine (e.g. company name, team sizing, use case, before costs, after costs, per-tool savings) and instructs the model to draft a ~100-word consultative summary.

### The Dynamic Prompt template:
```text
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
```

---

## 3. What Didn't Work (Prompt Iteration History)

### Iteration 1: The "Hype-Man" Fallacy
- *The Issue*: Without the strict non-fluff instructions, the model would produce typical marketing jargon ("Congratulations on taking this incredible step towards financial freedom! You've unlocked amazing potential..."). This sounds like a cheap generator, completely breaking the consultative, professional, and trustworthy brand tone necessary for B2B conversions.
- *The Fix*: Explicitly banned emojis, corporate buzzwords, and warm congratulations. Mandated a sharp financial officer persona.

### Iteration 2: Number Hallucinations
- *The Issue*: Passing general guidelines without anchoring would sometimes cause the model to estimate or slightly alter numbers (e.g. summarizing $125 to $130 or calling annual savings of $2,420 "over two thousand dollars"). 
- *The Fix*: Instructed the model to use the "precise dollar figures ($) provided" directly in its paragraph summaries.
