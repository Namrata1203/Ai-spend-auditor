# Automated Test Suite Documentation (TESTS.md)

This file lists the automated tests written for the **AI Spend Auditor** engine. Our tests run against the rules of our static logic engine to ensure financial correctness and logic reliability.

The tests are fully automated, written in modern TypeScript, and run directly in the environment using the `assert` library in standard NodeJS.

---

## Filename & Location
- **Path**: `/tests/auditEngine.test.ts`
- **Runner Script**: `npm test` or `npx tsx tests/auditEngine.test.ts`

---

## Coverage Profiles (All 5 Required Test Cases)

### 1. Test 1: Base Subscription Spend Arithmetic
- **Coverage**: Validates standard multiplication logic of seat sizes mapped to tier pricing.
- **Verification**: Asserts that `calculateCurrentSpend` for 3 Cursor Pro seats equals $60 and 2 Copilot seats equals $39 (or $38 for business).

### 2. Test 2: Claude Team 5-Seat Minimum Trap
- **Coverage**: Confirms that teams with under 5 users paying for Claude "Team" plan ($25) are flagged for ghost seats since the plan bills for a minimum of 5 seats ($125).
- **Verification**: Asserts that currentSpend equals $125, recommendation maps to Claude "Pro" ($20), recommendedSpend is $60, and monthly recovery savings equal exactly $65.

### 3. Test 3: Redundant Autocomplete Engines (Cursor + Copilot)
- **Coverage**: Ensures that users running both Cursor (any paid plan) and GitHub Copilot are flagged for autocomplete redundancy, recommending they cancel Copilot.
- **Verification**: Asserts that Copilot recommendedSpend is reduced to $0, and monthly savings capture 100% of the Copilot bill.

### 4. Test 4: Custom API Token Spend Arbitrage
- **Coverage**: Validates that raw pay-per-token API spent (OpenAI or Anthropic) yields a flat 25% discount when moved to bulk pre-negotiated Credex codes.
- **Verification**: Asserts that a current spend of $1,000 on OpenAI API is audited down to $750/mo, highlighting exactly $250/mo of savings.

### 5. Test 5: Over-provisioned Startup Plans (Cursor Business SSO)
- **Coverage**: Flag when teams of 4 developers or smaller pay for Cursor Business ($40/mo per seat) when individual Cursor Pro seats ($20/mo) offer the exact same core AI features without the SAML/SSO premium they don't need.
- **Verification**: Asserts that current spend of $120 for 3 seats gets audited down to $60/mo, saving $60.

---

## Running the Tests

To run the automated tests locally, execute this command at the project root:

```bash
npm test
```

*Note: Behind the scenes, this executes are custom TSX compiler: `tsx tests/auditEngine.test.ts` which runs with code exit `0` on success and `1` on failure.*
