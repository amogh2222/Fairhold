export type FindingClassification =
  | "NEW_DAMAGE"
  | "PRE_EXISTING"
  | "WEAR_AND_TEAR"
  | "DIRT_OR_LIGHTING"
  | "MISSING_PART"
  | "UNCERTAIN";

export interface FindingEligibilityInput {
  classification: FindingClassification;
  confidence: number;
  matchedBaselineMarkId?: string | null;
  ownerOverrideChargeable?: boolean | null;
  ownerOverrideReason?: string | null;
}

export interface EligibilityResult {
  isChargeable: boolean;
  reason: string;
}

/**
 * Deterministic Charge Eligibility Evaluation (Principle P2, P3, P4, P7)
 * Never determined by the LLM alone.
 */
export function evaluateChargeEligibility(
  finding: FindingEligibilityInput,
  businessThreshold: number = 0.75
): EligibilityResult {
  // If owner explicitly overrode UNCERTAIN or findings with a required written reason
  if (finding.ownerOverrideChargeable === true) {
    if (!finding.ownerOverrideReason || finding.ownerOverrideReason.trim().length === 0) {
      return {
        isChargeable: false,
        reason: "Owner override requires a documented written reason.",
      };
    }
    return {
      isChargeable: true,
      reason: `Owner manually marked chargeable with documented reason: "${finding.ownerOverrideReason.trim()}"`,
    };
  }

  if (finding.ownerOverrideChargeable === false) {
    return {
      isChargeable: false,
      reason: "Owner marked this finding as non-chargeable.",
    };
  }

  // Pre-existing marks acknowledged at checkout are NEVER chargeable (Principle P3)
  if (finding.classification === "PRE_EXISTING" || finding.matchedBaselineMarkId) {
    return {
      isChargeable: false,
      reason: "Non-chargeable: Pre-existing mark acknowledged by renter during check-out baseline.",
    };
  }

  // Normal wear and tear is NEVER chargeable (Principle P3)
  if (finding.classification === "WEAR_AND_TEAR") {
    return {
      isChargeable: false,
      reason: "Non-chargeable: Classified as normal wear and tear under business policy.",
    };
  }

  // Dirt or lighting artifacts are NEVER chargeable
  if (finding.classification === "DIRT_OR_LIGHTING") {
    return {
      isChargeable: false,
      reason: "Non-chargeable: Superficial dust, dirt, or photo lighting discrepancy.",
    };
  }

  // UNCERTAIN findings are NEVER automatically charged (Principle P4)
  if (finding.classification === "UNCERTAIN") {
    return {
      isChargeable: false,
      reason: "Non-chargeable by default: AI confidence was uncertain; requires human owner adjudication.",
    };
  }

  // Chargeable classifications: NEW_DAMAGE or MISSING_PART
  if (finding.classification === "NEW_DAMAGE" || finding.classification === "MISSING_PART") {
    if (finding.confidence < businessThreshold) {
      return {
        isChargeable: false,
        reason: `Non-chargeable: AI confidence (${(finding.confidence * 100).toFixed(1)}%) is below the business threshold (${(businessThreshold * 100).toFixed(1)}%). Treated as uncertain.`,
      };
    }

    return {
      isChargeable: true,
      reason: `Chargeable: Verified ${finding.classification.toLowerCase().replace("_", " ")} with high confidence (${(finding.confidence * 100).toFixed(1)}%).`,
    };
  }

  return {
    isChargeable: false,
    reason: "Non-chargeable: Unrecognized classification.",
  };
}
