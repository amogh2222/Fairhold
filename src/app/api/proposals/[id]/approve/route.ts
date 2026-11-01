import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transitionBookingStatus } from "@/lib/state-machine";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { notes } = body;

    const proposal = await db.settlementProposal.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const updated = await db.settlementProposal.update({
      where: { id },
      data: {
        status: "SENT_TO_RENTER",
        ownerApprovedAt: new Date(),
        notes: notes || proposal.notes,
      },
    });

    await db.auditEvent.create({
      data: {
        bookingId: proposal.bookingId,
        eventType: "SETTLEMENT_PROPOSED",
        actor: "OWNER",
        details: JSON.stringify({
          proposalId: id,
          proposedDamage: proposal.proposedDamage,
          proposedRefund: proposal.proposedRefund,
          notes,
        }),
      },
    });

    return NextResponse.json({ success: true, proposal: updated });
  } catch (error: any) {
    console.error("Proposal approve error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
