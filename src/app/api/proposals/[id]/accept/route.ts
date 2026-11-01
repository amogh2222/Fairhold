import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executeBookingSettlement } from "@/lib/settlement";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proposal = await db.settlementProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const result = await executeBookingSettlement({
      bookingId: proposal.bookingId,
      damageAmount: proposal.proposedDamage,
      actor: "RENTER",
      reason: "Renter accepted settlement proposal",
    });

    return NextResponse.json({
      success: true,
      settlement: result,
    });
  } catch (error: any) {
    console.error("Proposal accept error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
