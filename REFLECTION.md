# Engineering Reflection (REFLECTION.md)

This reflection details the engineering hurdles, architectural trade-offs, and critical insights discovered while building the **AI Spend Auditor**.

---

## 1. Core Technical Hurdles

### Bypassing Node ESM Conflicts via Bundling
- *The Problem*: Node.js has increasingly strict, often conflicting rules for running TypeScript ES Modules natively in production (`type: "module"` imports requiring `.js` extensions, no native support for global variables like `__dirname` or `__filename`, etc.).
- *The Solution*: Implemented an modern **esbuild** bundling step for our production backend build script (`package.json`). By bundling the entire server codebase into a single CommonJS (`.cjs`) output (`/dist/server.cjs`), we bypassed Node's strict ESM structural checks completely. It reduced filesystem overhead and ensured our Cloud Run compilation builds succeeded of the first take.

### Mitigating "AI Slop" & Forcing Professional Tone
- *The Problem*: AI models by default use flowery, overly happy, marketing-focused speech patterns. In a professional fractional CFO tool, this breaks brand credibility.
- *The Solution*: Primed the system prompt with a precise "senior procurement officer" persona, banned emojis, and forced the usage of raw numeric summaries directly in outputs.

---

## 2. Key Architectural Decisions

### Dual Logic Engine (Client + Server)
- *Decision*: Rather than isolating our rules calculations on the server, we architected `/src/auditEngine.ts` to be fully accessible on both the frontend React client and the backend Express database.
- *Trade-off*: By exporting shared functions, we enabled **instant visual layout feedback** as the user updates their team numbers or tool plans in the form, before they click submit. When they click the run button, the same logic executes server-side to guarantee consistency and secure a persistent social share page.

### Filesystem Database with Atomic Write Renames
- *Decision*: Used an atomic JSON file storage under `server/db.ts` to log created audit reports and capture leads.
- *Trade-off*: Safe JSON files are easy to configure, inspect, and reset. We implemented atomic write patterns (`write to db.json.tmp` and then `rename` to `db.json`) to prevent data corruption during massive concurrent parallel saves.
