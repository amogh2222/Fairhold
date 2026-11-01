import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { compareReturnInspection } from "@/lib/ai/return-compare";
import { evaluateChargeEligibility } from "@/lib/eligibility";
import { calculateSettlement } from "@/lib/pricing";
import { transitionBookingStatus } from "@/lib/state-machine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, photos } = body;

    if (!bookingId || !photos || !Array.isArray(photos)) {
      return NextResponse.json({ error: "bookingId and photos array are required" }, { status: 400 });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        item: true,
        business: true,
        inspections: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Step 1: Transition to INSPECTING
    await transitionBookingStatus({
      bookingId: booking.id,
      toStatus: "INSPECTING",
      actor: "OWNER",
      reason: "Owner started return condition inspection",
    });

    // Step 2: Create RETURN inspection record
    const inspection = await db.inspection.create({
      data: {
        bookingId: booking.id,
        type: "RETURN",
        status: "COMPLETED",
        summary: "Return inspection captured. AI comparison underway.",
      },
    });

    // Step 3: Fetch baseline photos and marks
    const checkoutInsp = booking.inspections?.find((i: any) => i.type === "CHECKOUT");
    const baselinePhotos = checkoutInsp ? await db.photo.findMany({ where: { inspectionId: checkoutInsp.id } }) : [];

    const baselineMarks: any[] = [];
    for (const bp of baselinePhotos) {
      const marks = await db.baselineMark.findMany({ where: { photoId: bp.id } });
      baselineMarks.push(...marks);
    }

    const wearAndTearPolicy =
      booking.business?.wearAndTearPolicy ||
      "Superficial scratches under 10mm on non-optical/non-screen surfaces, minor cosmetic rub marks, dust, and expected light wear on grips are considered normal wear and tear.";
    const confidenceThreshold = booking.business?.aiConfidenceThreshold || 0.75;

    const rateCard = typeof booking.item.rateCard === "string"
      ? JSON.parse(booking.item.rateCard)
      : booking.item.rateCard || [];

    const itemImages = typeof booking.item.images === "string"
      ? JSON.parse(booking.item.images)
      : booking.item.images || [];

    const createdReturnPhotos = [];
    const allFindings = [];

    // Step 4: Compare each photo pair
    for (const p of photos) {
      const returnPhoto = await db.photo.create({
        data: {
          inspectionId: inspection.id,
          shotKey: p.shotKey,
          fileUrl: p.fileUrl,
          sha256Hash: p.sha256Hash || "hash_" + Math.random().toString(36).substring(2, 10),
          width: p.width || 1200,
          height: p.height || 800,
          qaStatus: "PASSED",
        },
      });
      createdReturnPhotos.push(returnPhoto);

      // Find matching baseline photo
      const matchingBaseline = baselinePhotos.find((bp: any) => bp.shotKey === p.shotKey);
      const baselineUrl = matchingBaseline?.fileUrl || (itemImages[0] || p.fileUrl);
      const relevantBaselineMarks = baselineMarks
        .filter((bm: any) => bm.shotKey === p.shotKey)
        .map((bm: any) => ({
          id: bm.id,
          box: [bm.boxYmin, bm.boxXmin, bm.boxYmax, bm.boxXmax],
          description: bm.description,
          severity: bm.severity,
        }));

      // AI comparison (blind to owner desired charge)
      const aiFindings = await compareReturnInspection({
        shotKey: p.shotKey,
        baselinePhotoUrl: baselineUrl,
        returnPhotoUrl: p.fileUrl,
        baselineMarks: relevantBaselineMarks,
        wearAndTearPolicy,
        itemName: booking.item.name,
        category: booking.item.category,
      });

      // Filter and persist each finding
      for (const f of aiFindings) {
        // Deterministic eligibility evaluation (P2, P3, P4, P7)
        const eligibility = evaluateChargeEligibility(
          {
            classification: f.classification,
            confidence: f.confidence,
            matchedBaselineMarkId: f.matchedBaselineMarkId,
          },
          confidenceThreshold
        );

        const findingRecord = await db.finding.create({
          data: {
            inspectionId: inspection.id,
            shotKey: f.shotKey,
            boxYmin: f.box[0],
            boxXmin: f.box[1],
            boxYmax: f.box[2],
            boxXmax: f.box[3],
            classification: f.classification,
            severity: f.severity,
            confidence: f.confidence,
            explanation: f.explanation,
            isChargeable: eligibility.isChargeable,
            chargeEligibilityReason: eligibility.reason,
            matchedBaselineMarkId: f.matchedBaselineMarkId || null,
          },
        });
        allFindings.push(findingRecord);
      }
    }

    // Step 5: Deterministic pricing & settlement calculation
    const settlement = calculateSettlement({
      findings: allFindings,
      rateCard,
      replacementValue: booking.item.replacementValue,
      depositAmount: booking.depositAmount,
      rentalFeeAmount: booking.rentalFee,
      chargeFeeAtPickup: false, // single capture at return
      config: {
        severityMinorPct: 0.05,
        severityModeratePct: 0.15,
        severityMajorPct: 0.4,
      },
    });

    // Step 6: Create SettlementProposal
    const contestHours = booking.business?.contestWindowHours || 24;
    const renterDeadline = new Date(Date.now() + contestHours * 60 * 60 * 1000);

    const proposal = await db.settlementProposal.create({
      data: {
        bookingId: booking.id,
        inspectionId: inspection.id,
        status: "PENDING_OWNER_REVIEW",
        proposedDamage: settlement.cappedDamageAmount,
        proposedRefund: settlement.totalToRelease,
        breakdownJson: JSON.stringify(settlement),
        renterDeadline,
      },
    });

    // Step 7: Transition booking to PROPOSED
    await transitionBookingStatus({
      bookingId: booking.id,
      toStatus: "PROPOSED",
      actor: "SYSTEM",
      reason: `AI proposed settlement: \$${settlement.cappedDamageAmount.toFixed(2)} damage, \$${settlement.totalToRelease.toFixed(2)} deposit release`,
      payload: {
        proposalId: proposal.id,
        findingsCount: allFindings.length,
        chargeableCount: settlement.lines.length,
      },
    });

    return NextResponse.json({
      success: true,
      inspection,
      photos: createdReturnPhotos,
      findings: allFindings,
      settlement,
      proposal,
    });
  } catch (error: any) {
    console.error("Return inspection error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

