import { describe, it, expect } from "vitest";
import { evaluateChargeEligibility } from "../src/lib/eligibility";

describe("Deterministic Charge Eligibility (Principles P2, P3, P4, P7)", () => {
  const DEFAULT_THRESHOLD = 0.75;

  it("identifies new damage with high confidence as chargeable", () => {
    const result = evaluateChargeEligibility(
      {
        classification: "NEW_DAMAGE",
        confidence: 0.92,
        matchedBaselineMarkId: null,
      },
      DEFAULT_THRESHOLD
    );

    expect(result.isChargeable).toBe(true);
    expect(result.reason).toContain("Chargeable: Verified new damage");
  });

  it("enforces P3: Pre-existing marks acknowledged at checkout are NEVER chargeable", () => {
    const result = evaluateChargeEligibility(
      {
        classification: "PRE_EXISTING",
        confidence: 0.99,
        matchedBaselineMarkId: "baseline_mark_123",
      },
      DEFAULT_THRESHOLD
    );

    expect(result.isChargeable).toBe(false);
    expect(result.reason).toContain("Pre-existing mark acknowledged");
  });

  it("enforces P3: Normal wear and tear is NEVER chargeable", () => {
    const result = evaluateChargeEligibility(
      {
        classification: "WEAR_AND_TEAR",
        confidence: 0.95,
      },
      DEFAULT_THRESHOLD
    );

    expect(result.isChargeable).toBe(false);
    expect(result.reason).toContain("normal wear and tear");
  });

  it("excludes dirt or lighting artifacts from charging", () => {
    const result = evaluateChargeEligibility(
      {
        classification: "DIRT_OR_LIGHTING",
        confidence: 0.88,
      },
      DEFAULT_THRESHOLD
    );

    expect(result.isChargeable).toBe(false);
    expect(result.reason).toContain("dust, dirt, or photo lighting discrepancy");
  });

  it("enforces P4: UNCERTAIN findings are NEVER automatically charged", () => {
    const result = evaluateChargeEligibility(
      {
        classification: "UNCERTAIN",
        confidence: 0.85,
      },
      DEFAULT_THRESHOLD
    );

    expect(result.isChargeable).toBe(false);
    expect(result.reason).toContain("requires human owner adjudication");
  });

  it("rejects damage if AI confidence is below the business threshold", () => {
    const result = evaluateChargeEligibility(
      {
        classification: "NEW_DAMAGE",
        confidence: 0.65, // Below 0.75
      },
      DEFAULT_THRESHOLD
    );

    expect(result.isChargeable).toBe(false);
    expect(result.reason).toContain("below the business threshold");
  });

  it("allows owner override ONLY with documented written reason", () => {
    // Missing reason should fail
    const invalidOverride = evaluateChargeEligibility({
      classification: "UNCERTAIN",
      confidence: 0.5,
      ownerOverrideChargeable: true,
      ownerOverrideReason: "   ", // blank
    });
    expect(invalidOverride.isChargeable).toBe(false);
    expect(invalidOverride.reason).toContain("requires a documented written reason");

    // Valid override with written reason succeeds
    const validOverride = evaluateChargeEligibility({
      classification: "UNCERTAIN",
      confidence: 0.5,
      ownerOverrideChargeable: true,
      ownerOverrideReason: "Deep paint gouge exposes metal sub-chassis, verified by technician.",
    });
    expect(validOverride.isChargeable).toBe(true);
    expect(validOverride.reason).toContain("Deep paint gouge exposes metal sub-chassis");
  });
});
