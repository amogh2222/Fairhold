import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reassessContestedFinding } from "@/lib/ai/contest";
import { transitionBookingStatus } from "@/lib/state-machine";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required with findingId and comment" }, { status: 400 });
    }

    const proposal = await db.settlementProposal.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const createdContestItems = [];

    for (const item of items) {
      const finding = await db.finding.findUnique({
        where: { id: item.findingId },
      });

      if (!finding) continue;

      // AI impartial reassessment
      const reassessment = await reassessContestedFinding({
        findingDescription: finding.explanation,
        findingClassification: finding.classification,
        originalChargeAmount: finding.ownerOverrideAmount || 0,
        renterComment: item.comment,
        renterPhotoUrls: item.photoUrls || [],
      });

      const contestItem = await db.contestItem.create({
        data: {
          proposalId: proposal.id,
          findingId: finding.id,
          renterComment: item.comment,
          renterPhotosJson: JSON.stringify(item.photoUrls || []),
          aiRecommendation: reassessment.recommendation,
          aiReasoning: reassessment.reasoning,
        },
      });

      createdContestItems.push(contestItem);
    }

    // Update proposal status
    await db.settlementProposal.update({
      where: { id: proposal.id },
      data: { status: "CONTESTED", renterDecidedAt: new Date() },
    });

    // Transition booking status to CONTESTED
    await transitionBookingStatus({
      bookingId: proposal.bookingId,
      toStatus: "CONTESTED",
      actor: "RENTER",
      reason: `Renter contested ${createdContestItems.length} finding(s) with supporting statements`,
      payload: {
        proposalId: proposal.id,
        contestedCount: createdContestItems.length,
      },
    });

    return NextResponse.json({
      success: true,
      contestItems: createdContestItems,
    });
  } catch (error: any) {
    console.error("Contest error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

