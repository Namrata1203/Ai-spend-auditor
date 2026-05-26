import assert from "assert";
import { runAuditEngine, TOOL_CONFIGS, calculateCurrentSpend } from "../src/auditEngine";
import { ToolID, PrimaryUseCase, SelectedToolInput } from "../src/types";

console.log("=== Running Spend Optimizer Automated Test Suite ===");

// Helper to run assertions on results
function getResultForTool(results: any[], toolId: ToolID) {
  return results.find(r => r.toolId === toolId);
}

// TEST 1: Simple base calculations check
function testBaseCalculations() {
  console.log("Test 1: Verifying base subscription spend arithmetic...");
  const cursorSpend = calculateCurrentSpend(ToolID.CURSOR, "pro", 3);
  assert.strictEqual(cursorSpend, 60, "3 Cursor Pro seats should cost $60");
  
  const copilotSpend = calculateCurrentSpend(ToolID.GITHUB_COPILOT, "business", 2);
  assert.strictEqual(copilotSpend, 38, "2 Copilot Business seats should cost $38");
  
  console.log("✓ Test 1 Passed: Base calculations match standard billing models.");
}

// TEST 2: Claude Team plan 5-seat minimum optimization trap
function testClaudeTeamMinimumTrap() {
  console.log("Test 2: Verifying Claude Team 5-seat under-provisioning trap...");
  const inputs: SelectedToolInput[] = [
    { toolId: ToolID.CLAUDE, planId: "team", seats: 3 }
  ];
  
  // Current outlay: 5 * $25 = $125
  // Optimized outlay: moved to individual Pro -> 3 * $20 = $60
  // Savings: $65/mo
  const results = runAuditEngine(inputs, 3, PrimaryUseCase.CODING);
  const claudeResult = getResultForTool(results, ToolID.CLAUDE);
  
  assert.strictEqual(claudeResult.currentSpend, 125, "Claude Team with 3 seats must trigger 5 seat billing minimum ($125)");
  assert.strictEqual(claudeResult.recommendedPlanId, "pro", "Recommendation must be to move to Claude Pro plan");
  assert.strictEqual(claudeResult.recommendedSpend, 60, "Recommended Claude Pro spend for 3 seats should be $60");
  assert.strictEqual(claudeResult.savingsMonthly, 65, "Claude Team monthly optimization savings must equal exactly $65");
  assert.strictEqual(claudeResult.isOptimal, false, "Claude Team with 3 seats should be marked as non-optimal");
  
  console.log("✓ Test 2 Passed: 5-seat minimum traps are correctly detected and optimized.");
}

// TEST 3: Duplicate IDE completes completion redundancy check (Cursor + Copilot)
function testDuplicateCompletionRedundancy() {
  console.log("Test 3: Verifying duplicate developer autocomplete overlaps (Cursor + Copilot)...");
  const inputs: SelectedToolInput[] = [
    { toolId: ToolID.CURSOR, planId: "pro", seats: 5 },
    { toolId: ToolID.GITHUB_COPILOT, planId: "individual", seats: 5 }
  ];
  
  const results = runAuditEngine(inputs, 5, PrimaryUseCase.CODING);
  const copilotResult = getResultForTool(results, ToolID.GITHUB_COPILOT);
  
  assert.strictEqual(copilotResult.recommendedSpend, 0, "Recommended Copilot spend should be $0 due to Cursor redundancy");
  assert.strictEqual(copilotResult.savingsMonthly, 50, "Monthly savings should equal full Copilot outlay ($50)");
  assert.strictEqual(copilotResult.isOptimal, false, "Duplicate Copilot should be categorized as non-optimal spend");
  
  console.log("✓ Test 3 Passed: Redundant developer seats correctly flagged for elimination.");
}

// TEST 4: Raw Direct API Usage bill arbitrage via Credex credits
function testApiVolumeArbitrage() {
  console.log("Test 4: Verifying raw token direct API spend bulk credit buybacks...");
  const inputs: SelectedToolInput[] = [
    { toolId: ToolID.OPENAI_API, planId: "payg", seats: 0, customSpend: 1000 }
  ];
  
  // Credex grants 25% discount on bulk API tokens:
  // Before: $1,000, After: $750, Monthly savings = $250
  const results = runAuditEngine(inputs, 10, PrimaryUseCase.CODING);
  const apiResult = getResultForTool(results, ToolID.OPENAI_API);
  
  assert.strictEqual(apiResult.currentSpend, 1000, "Direct API outlay should matchEntered Custom Spend ($1,000)");
  assert.strictEqual(apiResult.recommendedSpend, 750, "Optimized outlay must represent flat 25% bulk credit discount ($750)");
  assert.strictEqual(apiResult.savingsMonthly, 250, "Monthly recovery must capture exactly $250 of savings");
  
  console.log("✓ Test 4 Passed: Raw API spend credit discount margins correctly mapped.");
}

// TEST 5: Over-provisioned Enterprise settings (Cursor Business vs Pro on tiny teams)
function testOverProvisionedPremiumPlans() {
  console.log("Test 5: Verifying over-provisioned Business controls on small developer teams...");
  const inputs: SelectedToolInput[] = [
    { toolId: ToolID.CURSOR, planId: "business", seats: 3 }
  ];
  
  // Teams <= 4 developers don't require Business SSO, and should be downgraded to Pro:
  // Before: 3 * $40 = $120
  // After: 3 * $20 = $60
  // Savings: $60/mo
  const results = runAuditEngine(inputs, 3, PrimaryUseCase.CODING);
  const cursorResult = getResultForTool(results, ToolID.CURSOR);
  
  assert.strictEqual(cursorResult.currentSpend, 120, "Current Cursor Business outlay for 3 developers is $120");
  assert.strictEqual(cursorResult.recommendedPlanId, "pro", "Should recommend downgrading Cursor to Pro plan");
  assert.strictEqual(cursorResult.recommendedSpend, 60, "Recommended spend should equal Pro rates ($60)");
  assert.strictEqual(cursorResult.savingsMonthly, 60, "Recovery margin equals $60 monthly");
  
  console.log("✓ Test 5 Passed: Premium plan excesses for small startups correctly trimmed.");
}

try {
  testBaseCalculations();
  testClaudeTeamMinimumTrap();
  testDuplicateCompletionRedundancy();
  testApiVolumeArbitrage();
  testOverProvisionedPremiumPlans();
  console.log("\n=== ALL 5 AUTOMATED TESTS PASSED SUCCESSFULLY! ===");
} catch (err: any) {
  console.error("\n❌ TEST SUITE FAILED:", err?.message || err);
  process.exit(1);
}
