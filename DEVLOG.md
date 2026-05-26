# Development Log (DEVLOG.md)

This log tracks the chronological course of our AI Spend Auditor's engineering, from system design to testing and deployment.

---

## Day 1 — 2026-05-20
**Hours worked:** 4  
**What I did:** Designed the system architecture for "AI Spend Auditor". Inspected workspace configurations, updated `metadata.json` with the literal naming convention, and analyzed the core full-stack Express + Vite template. Researched official modern pricing for Cursor, Claude, ChatGPT, Windsurf, v0, and GitHub Copilot to design the static pricing mapping rules.  
**What I learned:** Discovered that Vite HMR is disabled in AI Studio which changes layout rendering behavior. I need to make sure frontend state is persisted securely using native key-value storage.  
**Blockers / what I'm stuck on:** Finding official price verification URLs that specify minimum seats. Found that Claude Team lists minimum 5 seats, while ChatGPT Team requires 2 seats.  
**Plan for tomorrow:** Build types, pricing structures, and implementation of our mathematics audit calculators.

---

## Day 2 — 2026-05-21
**Hours worked:** 5  
**What I did:** Defined the core TypeScript schemas inside `/src/types.ts`. Created `/src/auditEngine.ts` mapping out the pricing datasets and logic rules (Claude Team minimum-seat penalty, Copilot-Cursor autocomplete redundancies, and custom payload token discounts). We set our audit targets strictly to defensible, arithmetic metrics that a finance manager would approve.  
**What I learned:** Map keys can be accessed efficiently using a native dictionary mapping approach, avoiding complex iteration loops and reducing file-sizes to prevent token compile drop-offs.  
**Blockers / what I'm stuck on:** Handling custom inputs for raw Direct API spend (pay-per-token models). Solved this by adding a helper key `customSpend`.  
**Plan for tomorrow:** Design and program the interactive client form with persistent localStorage states.

---

## Day 3 — 2026-05-22
**Hours worked:** 6  
**What I did:** Built the interactive audit input form (`/src/components/AuditForm.tsx`). Implemented a highly flexible list management system allowing users to add and edit active subscriptions dynamically. Enabled automatic state caching using `localStorage` hooks so states survive page refreshes. Created the application's header component.  
**What I learned:** Designing high-contrast touch points (44px) inside standard desktop layouts drastically improves accessibility and mobile usability levels.  
**Blockers / what I'm stuck on:** Preventing redundant entries of identical tools in the active stack. Added an exclusion filter on selection lists.  
**Plan for tomorrow:** Program the full-stack database helper and construct the Express router backend server.

---

## Day 4 — 2026-05-23
**Hours worked:** 5  
**What I did:** Programmed a secure backend filesystem JSON database inside `/server/db.ts` to log created audit reports and capture leads. Wrote our central Express application server `/server.ts` configuring JSON headers, static directories, and mounting handlers to parse audit requests securely.  
**What I learned:** Stateless backend containers (like Cloud Run) discard direct local files on scaling resets, suggesting that the local JSON store acts as a reliable mock/sandbox environment, but local environments will require stable adapters for persistent cloud structures like Firestore.  
**Blockers / what I'm stuck on:** Transitioning server ts files cleanly during builds. Solved by updating the build script inside `package.json` to bundle using `esbuild` to CommonJS `CJS`.  
**Plan for tomorrow:** Integrate the Gemini AI server-side summarizer and fallback prompting.

---

## Day 5 — 2026-05-24
**Hours worked:** 6  
**What I did:** Integrated `@google/genai` on our Express server. Created are custom fractional-CFO prompts inside `/server.ts` requesting summaries. Designed a mathematically aligned, robust static fallback function inside `/server.ts` that triggers automatically on network or API key failures to guarantee continuous user experience.  
**What I learned:** Gemini 3 series models support extremely streamlined text-extraction using the simple `.text` getter property, eliminating older legacy response candidate arrays parsing.  
**Blockers / what I'm stuck on:** Mitigating typical marketing "AI fluff" from the LLM outputs. Fixed this by modifying system instructions to explicitly require CFO-level precision and ban emojis.  
**Plan for tomorrow:** Create link sharing and parse dynamic Open Graph tags for neat social previews.

---

## Day 6 — 2026-05-25
**Hours worked:** 5  
**What I did:** Implemented dynamic Open Graph social share metatags on shared URLs (`/share/:id`). The Express server intercepts crawler requests, retrieves the audit figures, parses `index.html` from the build, and injects customized tags dynamically so links look magnificent on Slack and X. Designed and structured the results display cards.  
**What I learned:** Using regex replacements on static index file buffers is overwhelmingly faster and cleaner than loading bloated template engines like EJS.  
**Blockers / what I'm stuck on:** Stripping confidential client info (business names, emails, roles) from public share requests. Handled this by feeding a strict `public=true` parameter in backend endpoints.  
**Plan for tomorrow:** Write comprehensive automated test assertions, run final verifications, and deploy documentation.

---

## Day 7 — 2026-05-26
**Hours worked:** 4  
**What I did:** Programmed exactly 5 distinct automated unit tests inside `/tests/auditEngine.test.ts` covering seat traps, redundancies, and credit arbitrages using Node's native assertions. Configured `"npm test"` script routines. Ran final linter, compiler checks, restarted dev servers, and compiled the exhaustive entrepreneurial files (GTM, Economics, Reflection, Architecture).  
**What I learned:** Running tests inside sandboxes requires executing with whitelist `npx` bundles due to strict container host path permissions.  
**Blockers / what I'm stuck on:** Resolving tiny TypeScript typing compiler mismatches on server-side imports. Cleaned up missing reference imports on `AuditInput`.  
**Plan for tomorrow:** Finalize handoff.
