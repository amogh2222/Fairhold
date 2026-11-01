import { describe, it, expect } from "vitest";
import { filterEvidenceClaims, EvidenceClaim } from "../src/lib/pdf/evidence-pdf";

describe("Dispute Evidence Claim Filtering (Tamper-Proof Dossier)", () => {
  it("strictly filters claims to only those with valid verified source IDs", () => {
    const validSourceIds = new Set<string>([
      "booking_123",
      "insp_checkout_456",
      "auth_pp_789",
      "capture_pp_999",
    ]);

    const claims: EvidenceClaim[] = [
      {
        claim: "Renter authorized deposit hold of $500.00.",
        sourceId: "auth_pp_789", // Valid
      },
      {
        claim: "Renter acknowledged baseline condition marks at checkout.",
        sourceId: "insp_checkout_456", // Valid
      },
      {
        claim: "Owner claimed item was dropped on concrete floor without inspection record.",
        sourceId: "fake_nonexistent_source", // Invalid / unverified
      },
      {
        claim: "Unverified third-party accusation.",
        sourceId: "", // Missing
      },
      {
        claim: "Capture completed with final_capture releasing remainder.",
        sourceId: "capture_pp_999", // Valid
      },
    ];

    const filtered = filterEvidenceClaims(claims, validSourceIds);

    expect(filtered.length).toBe(3);
    expect(filtered.map((c) => c.sourceId)).toEqual([
      "auth_pp_789",
      "insp_checkout_456",
      "capture_pp_999",
    ]);
  });
});

