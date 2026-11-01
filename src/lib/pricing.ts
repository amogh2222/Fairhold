export interface RateCardEntry {
  damageType: string;
  price: number;
}

export interface BusinessPricingConfig {
  severityMinorPct: number; // e.g. 0.05 (5%)
  severityModeratePct: number; // e.g. 0.15 (15%)
  severityMajorPct: number; // e.g. 0.40 (40%)
}

export interface PricingFindingInput {
  id: string;
  shotKey: string;
  description: string;
  classification: "NEW_DAMAGE" | "MISSING_PART";
  severity?: "minor" | "moderate" | "major" | string;
  ownerOverrideAmount?: number | null;
}

export interface ChargeLine {
  findingId: string;
  shotKey: string;
  description: string;
  classification: string;
  severity: string;
  method: "RATE_CARD" | "PERCENTAGE_REPLACEMENT" | "OWNER_OVERRIDE";
  formula: string;
  inputs: {
    matchedRateCardItem?: string;
    rateCardPrice?: number;
    replacementValue?: number;
    percentageApplied?: number;
    rawCalculatedAmount: number;
  };
  amount: number;
}

export interface SettlementCalculation {
  lines: ChargeLine[];
  subtotalDamage: number;
  depositAmount: number;
  cappedDamageAmount: number;
  wasDepositCapped: boolean;
  rentalFeeAmount: number;
  chargeFeeAtPickup: boolean;
  totalToCapture: number;
  totalToRelease: number;
}

/**
 * Deterministically calculate the charge for a single finding (Principle P7).
 */
export function calculateFindingCharge(params: {
  finding: PricingFindingInput;
  rateCard: RateCardEntry[];
  replacementValue: number;
  config: BusinessPricingConfig;
}): ChargeLine {
  const { finding, rateCard, replacementValue, config } = params;
  const severity = (finding.severity || "minor").toLowerCase() as "minor" | "moderate" | "major";

  // 1. Owner override amount takes precedence if provided
  if (finding.ownerOverrideAmount !== undefined && finding.ownerOverrideAmount !== null) {
    const amount = Math.max(0, finding.ownerOverrideAmount);
    return {
      findingId: finding.id,
      shotKey: finding.shotKey,
      description: finding.description,
      classification: finding.classification,
      severity,
      method: "OWNER_OVERRIDE",
      formula: `Owner negotiated adjustment: $${amount.toFixed(2)}`,
      inputs: {
        rawCalculatedAmount: amount,
      },
      amount,
    };
  }

  // 2. Check for matching Rate Card entry
  const descLower = finding.description.toLowerCase();
  const matchedEntry = rateCard.find((entry) => {
    const typeLower = entry.damageType.toLowerCase();
    return descLower.includes(typeLower) || typeLower.includes(descLower);
  });

  if (matchedEntry) {
    return {
      findingId: finding.id,
      shotKey: finding.shotKey,
      description: finding.description,
      classification: finding.classification,
      severity,
      method: "RATE_CARD",
      formula: `Rate card exact match: "${matchedEntry.damageType}" = $${matchedEntry.price.toFixed(2)}`,
      inputs: {
        matchedRateCardItem: matchedEntry.damageType,
        rateCardPrice: matchedEntry.price,
        rawCalculatedAmount: matchedEntry.price,
      },
      amount: matchedEntry.price,
    };
  }

  // 3. Fallback: Severity percentage of item replacement value
  let pct = config.severityMinorPct || 0.05;
  if (severity === "moderate") pct = config.severityModeratePct || 0.15;
  if (severity === "major") pct = config.severityMajorPct || 0.40;

  // Missing parts default to major percentage or 25% if no rate card
  if (finding.classification === "MISSING_PART") {
    pct = Math.max(pct, 0.25);
  }

  const rawAmount = Math.round(replacementValue * pct * 100) / 100;

  return {
    findingId: finding.id,
    shotKey: finding.shotKey,
    description: finding.description,
    classification: finding.classification,
    severity,
    method: "PERCENTAGE_REPLACEMENT",
    formula: `${(pct * 100).toFixed(0)}% of replacement value ($${replacementValue.toFixed(2)}) = $${rawAmount.toFixed(2)}`,
    inputs: {
      replacementValue,
      percentageApplied: pct,
      rawCalculatedAmount: rawAmount,
    },
    amount: rawAmount,
  };
}

/**
 * Deterministically compute full settlement totals with deposit capping.
 */
export function calculateSettlementTotals(params: {
  lines: ChargeLine[];
  depositAmount: number;
  rentalFee: number;
  chargeFeeAtPickup?: boolean;
}): SettlementCalculation {
  const { lines, depositAmount, rentalFee, chargeFeeAtPickup = false } = params;

  const subtotalDamage = lines.reduce((acc, line) => acc + line.amount, 0);
  const wasDepositCapped = subtotalDamage > depositAmount;
  const cappedDamageAmount = Math.min(subtotalDamage, depositAmount);

  // If rental fee was already captured at pickup, total to capture is just damage
  // If rental fee was held until return (default), capture rental fee + damage in ONE capture
  const totalToCapture = chargeFeeAtPickup
    ? cappedDamageAmount
    : Math.round((rentalFee + cappedDamageAmount) * 100) / 100;

  const totalToRelease = Math.max(0, Math.round((depositAmount - cappedDamageAmount) * 100) / 100);

  return {
    lines,
    subtotalDamage,
    depositAmount,
    cappedDamageAmount,
    wasDepositCapped,
    rentalFeeAmount: rentalFee,
    chargeFeeAtPickup,
    totalToCapture,
    totalToRelease,
  };
}

/**
 * End-to-end settlement evaluator from finding list.
 */
export function calculateSettlement(params: {
  findings: any[];
  rateCard: RateCardEntry[];
  replacementValue: number;
  depositAmount: number;
  rentalFeeAmount: number;
  chargeFeeAtPickup?: boolean;
  config?: BusinessPricingConfig;
}): SettlementCalculation {
  const {
    findings,
    rateCard,
    replacementValue,
    depositAmount,
    rentalFeeAmount,
    chargeFeeAtPickup = false,
    config = {
      severityMinorPct: 0.05,
      severityModeratePct: 0.15,
      severityMajorPct: 0.4,
    },
  } = params;

  const chargeableFindings = findings.filter(
    (f) =>
      (f.isChargeable || f.classification === "NEW_DAMAGE" || f.classification === "MISSING_PART") &&
      f.classification !== "PRE_EXISTING" &&
      f.classification !== "WEAR_AND_TEAR" &&
      f.classification !== "DIRT_OR_LIGHTING"
  );

  const lines = chargeableFindings.map((f) =>
    calculateFindingCharge({
      finding: {
        id: f.id,
        shotKey: f.shotKey,
        description: f.description || f.explanation,
        classification: f.classification,
        severity: f.severity,
        ownerOverrideAmount: f.ownerOverrideAmount,
      },
      rateCard,
      replacementValue,
      config,
    })
  );

  return calculateSettlementTotals({
    lines,
    depositAmount,
    rentalFee: rentalFeeAmount,
    chargeFeeAtPickup,
  });
}

