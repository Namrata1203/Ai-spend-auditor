# AI Spend Auditor (by Credex)

The **AI Spend Auditor** is a free, high-utility financial scan tool designed specifically for startup founders, engineering managers, and fractional CFOs. 

Most startups have no visibility into how they overspend on AI subscriptions, duplicate developer licenses, and retail pay-per-token API outlays. This web application audits their software stacks, flags seat-minimum penalties and overlapping tools, and serves as an organic lead-generation engine for **Credex** (which sells high-volume pre-funded AI credits at a flat 25% discount).

---

## 🚀 Key Features

1. **Rule-Based Cost Audit Engine**: Vetted calculations covering real-world anomalies (Claude Team 5-seat minimum traps, ChatGPT/v0 Team 2-seat minimum traps, and Cursor/Copilot completions redundancy).
2. **Dynamic AI Fractional-CFO Diagnostic**: Backed by a server-side **Gemini 3.5 Flash** integration that reads audit outlays and writes a customized diagnostic summary (with a solid, mathematically styled fallback generator on key omissions).
3. **Lead Capture & Transaction Delivery Email**: Simple transactional email gate allowing users to save report states, and booking links for high-volume accounts to consult with Credex credits sales.
4. **Dynamic Social metatag Injector (Viral Social Loop)**: The server intercepts shared report links (`/share/:reportId`) and injects dynamic Open Graph details so that social snippets render custom values (e.g., *"Acme Corp saved $2,420/yr on AI tools!"*) to trigger peer conversions on Slack and Twitter/X.
5. **Aesthetic UI Pairing**: Structured lists, high-contrast buttons, responsive custom SVG compare-charts, styled in space-grotesk display headings with a slate canvas feel.

---

## 🛠️ Project Structure

- `/src/types.ts`: Applicationwide data interfaces.
- `/src/auditEngine.ts`: Source-cited pricing datasets and core calculations.
- `/src/components/Header.tsx`: Clean SaaS header pointing to Credex Dashboard.
- `/src/components/AuditForm.tsx`: Interlocking selection lists with input `localStorage` caching.
- `/src/components/AuditResults.tsx`: Charts, tables, dynamic AI diagnosticians, lead gates, and clipboards link copy components.
- `/server.ts`: Node express server that coordinates APIs and handles dynamic HTML headers metadata replacements on crawler requests.
- `/server/db.ts`: Secure file-safe JSON database read/write handlers.
- `/tests/auditEngine.test.ts`: Custom automated test suite covering all major pricing rules.

---

## ⚙️ Setup & Execution

### 1. Requirements & Configuration
Install dependencies:
```bash
npm install
```

Configure your environment variables in `.env` (sourced from `.env.example`):
```env
GEMINI_API_KEY="YOUR_GOOGLE_AI_STUDIO_KEY"
```

### 2. Run Locally in Development Mode
Starts the full-stack server with live-reloaded Vite dev middlewares:
```bash
npm run dev
```

### 3. Build & Execution in Production Mode
Bundles frontend static files into `/dist`, compiles server code using `esbuild` down to CommonJS inside `/dist/server.cjs`, and launches the fast production node instances:
```bash
npm run build
npm start
```

### 4. Running Automated Tests
Validates all 5 audit calculations:
```bash
npm test
```

---

## 📈 Entrepreneurial & Deliverables Logs

To review our business model, user validation sessions, go-to-market strategies, and system mechanics, please consult these documentation files in the repository root:

- **[PRICING_DATA.md](./PRICING_DATA.md)**: Source URLs checking every plan price.
- **[PROMPTS.md](./PROMPTS.md)**: Server-side Gemini prompting templates.
- **[TESTS.md](./TESTS.md)**: Automated unit-test coverage profiles.
- **[DEVLOG.md](./DEVLOG.md)**: 7-day chronological hours-worked log.
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: High-level server-to-client directory blueprints.
- **[REFLECTION.md](./REFLECTION.md)**: Lessons and tech-hurdle write-ups.
- **[GTM.md](./GTM.md)**: Our Go-To-Market and viral PH launch guide.
- **[ECONOMICS.md](./ECONOMICS.md)**: Pricing Arbitrage and Funnel Economics LTV/CAC metrics.
- **[USER_INTERVIEWS.md](./USER_INTERVIEWS.md)**: Real B2B user testing logs.
- **[LANDING_COPY.md](./LANDING_COPY.md)**: Headline copy decks.
- **[METRICS.md](./METRICS.md)**: Target Lighthouse SLA benchmarks and funnel ratios.
