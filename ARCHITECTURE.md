# Application Architecture (ARCHITECTURE.md)

This document describes the structural layout, data flows, and build pipelines of the **AI Spend Auditor** application.

---

## 1. System Overview

The application is engineered as a **full-stack Express + React (TypeScript) SPA**, built on **Vite** and configured to run inside sandboxed container nodes (e.g., Cloud Run). 

```text
               +-------------------------------------------+
               |                 BROWSER                   |
               |                                           |
               |  +------------------+  +---------------+  |
               |  |   Creator Form   |  |  Results UI   |  |
               |  +--------+---------+  +-------+-------+  |
               +-----------|--------------------|----------+
                           | POST               | GET (anonymous)
                           v /api/audit         v /api/reports/:id
               +-------------------------------------------+
               |               EXPRESS API                 |
               |                                           |
               |  +-----------------+   +---------------+  |
               |  | Audit Engine    |   | Gemini API    |  |
               |  | Calc            |   | Summarizer    |  |
               |  +--------+--------+   +-------+-------+  |
               +-----------|--------------------|----------+
                           v                    v
               +--------------------+   +---------------+
               | JSON Database File |   | Google GenAI  |
               |  (data/db.json)    |   | Cloud Service |
               +--------------------+   +---------------+
```

---

## 2. Component Directories & Layers

### Frontend Layer (React & Tailwind CSS)
- **`/src/types.ts`**: Declare global data structures (e.g. `SelectedToolInput`, `AuditReport`, `ToolConfig`).
- **`/src/auditEngine.ts`**: Core pricing datasets and audit algorithms. It is accessible by both front/back end, enabling instant client outlay calculations.
- **`/src/components/Header.tsx`**: Branding header showcasing Credex's relationship.
- **`/src/components/AuditForm.tsx`**: Multi-input form with active subscription selections and `localStorage` state retention.
- **`/src/components/AuditResults.tsx`**: Renders custom SVG comparison graphs, lists per-tool optimization insights, displays the Gemini consulting diagnostic, and hosts email lead capturing.

### Backend Layer (Express)
- **`/server.ts`**: Application gateway. Boots the server on port `3000`, hosts REST endpoints (`/api/audit`, `/api/reports/:id`, `/api/leads`), and handles dynamic Open Graph header replacement for crawling loops.
- **`/server/db.ts`**: Simple, atomic filesystem JSON persistence layer. It manages writes securely by using temporary write-and-rename procedures (`db.json.tmp` -> `db.json`).

---

## 3. Core Software Pipelines & Build Details

### The Development Cycle
- In development, Vite is mounted directly as an **Express middleware** (`createViteServer` with `middlewareMode: true`).
- API requests are matched first, and unmatched routes are delegated to Vite, guaranteeing optimal reload states with no CORS overheads.

### The Production Build Pipeline
The production build compiles the frontend assets and server bundles cleanly:
1. **Frontend Compilation**: `vite build` translates TypeScript React files into static assets stored in `/dist`.
2. **Backend Bundling**: `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` compiles our TypeScript backend server into a single CommonJS bundle inside `dist/server.cjs`.
3. This completely bypasses runtime ES Module resolution issues and facilitates fast startup metrics on server endpoints.
