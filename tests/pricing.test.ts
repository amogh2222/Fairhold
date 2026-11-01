import { describe, it, expect } from "vitest";
import {
  calculateFindingCharge,
  calculateSettlement,
  RateCardEntry,
} from "../src/lib/pricing";

describe("Deterministic Pricing Engine (Principle P7)", () => {
  const sampleRateCard: RateCardEntry[] = [
    { damageType: "LCD screen crack or bleed", price: 220 },
    { damageType: "Deep glass scratch on lens element", price: 350 },
    { damageType: "Chassis dent into magnesium frame", price: 175 },
  ];

  const config = {
    severityMinorPct: 0.05,
    severityModeratePct: 0.15,
    severityMajorPct: 0.4,
  };

  it("matches rate card price deterministically when damage type aligns", () => {
    const charge = calculateFindingCharge({
      finding: {
        id: "f1",
        shotKey: "shot_rear_lcd",
        description: "LCD screen crack or bleed visible across lower display matrix",
        classification: "NEW_DAMAGE",
        severity: "major",
      },
      rateCard: sampleRateCard,
      replacementValue: 2499,
      config,
    });

    expect(charge.method).toBe("RATE_CARD");
    expect(charge.amount).toBe(220);
    expect(charge.formula).toContain("LCD screen crack or bleed");
  });

  it("calculates percentage of replacement value when no rate card matches", () => {
    // Moderate severity -> 15% of $1000 = $150
    const charge = calculateFindingCharge({
      finding: {
        id: "f2",
        shotKey: "shot_gimbal",
        description: "Severed motor ribbon cable on pan axis",
        classification: "NEW_DAMAGE",
        severity: "moderate",
      },
      rateCard: sampleRateCard,
      replacementValue: 1000,
      config,
    });

    expect(charge.method).toBe("PERCENTAGE_REPLACEMENT");
    expect(charge.amount).toBe(150); // 15% of 1000
    expect(charge.formula).toContain("15% of replacement value ($1000.00)");
  });

  it("caps total damage strictly at deposit amount (Principle P7)", () => {
    const findings = [
      {
        id: "f1",
        shotKey: "shot_lens",
        description: "Deep glass scratch on lens element",
        classification: "NEW_DAMAGE",
        severity: "major",
        isChargeable: true,
      },
      {
        id: "f2",
        shotKey: "shot_lcd",
        description: "LCD screen crack or bleed",
        classification: "NEW_DAMAGE",
        severity: "major",
        isChargeable: true,
      },
    ];

    // Total damage before cap: 350 + 220 = $570
    // Deposit amount: $500
    const settlement = calculateSettlement({
      findings,
      rateCard: sampleRateCard,
      replacementValue: 2500,
      depositAmount: 500,
      rentalFeeAmount: 150,
      chargeFeeAtPickup: false,
      config,
    });

    expect(settlement.subtotalDamage).toBe(570);
    expect(settlement.wasDepositCapped).toBe(true);
    expect(settlement.cappedDamageAmount).toBe(500); // capped at deposit

    // Single capture at return: fee ($150) + damage ($500) = $650
    expect(settlement.totalToCapture).toBe(650);
    expect(settlement.totalToRelease).toBe(0); // 500 - 500 = 0
  });

  it("releases 100% of deposit hold on clean return with zero damage", () => {
    const cleanFindings = [
      {
        id: "f_wear",
        shotKey: "shot_grip",
        description: "Normal rubber grip friction wear",
        classification: "WEAR_AND_TEAR",
        isChargeable: false,
      },
      {
        id: "f_dust",
        shotKey: "shot_front",
        description: "Superficial wipeable dust particles",
        classification: "DIRT_OR_LIGHTING",
        isChargeable: false,
      },
    ];

    const settlement = calculateSettlement({
      findings: cleanFindings,
      rateCard: sampleRateCard,
      replacementValue: 2500,
      depositAmount: 500,
      rentalFeeAmount: 225,
      chargeFeeAtPickup: false,
      config,
    });

    expect(settlement.lines.length).toBe(0);
    expect(settlement.cappedDamageAmount).toBe(0);
    expect(settlement.totalToCapture).toBe(225); // rental fee only
    expect(settlement.totalToRelease).toBe(500); // 100% of deposit returned
  });
});
